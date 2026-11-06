import assert from "node:assert/strict";
import { app } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

type JsonBody = Record<string, unknown>;

interface ApiResult {
  status: number;
  body: JsonBody;
  cookie: string | null;
}

let baseUrl = "";

function extractCookie(response: Response): string | null {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) return null;

  const match = setCookie.match(/nestora_token=([^;]+)/);
  return match ? `nestora_token=${match[1]}` : null;
}

async function api(
  path: string,
  options: {
    method?: string;
    body?: JsonBody;
    formData?: FormData;
    cookie?: string | null;
  } = {},
): Promise<ApiResult> {
  const headers: Record<string, string> = {};
  if (options.cookie) headers.Cookie = options.cookie;
  if (options.body) headers["Content-Type"] = "application/json";

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.formData ?? (options.body ? JSON.stringify(options.body) : undefined),
  });

  const body = (await response.json().catch(() => ({}))) as JsonBody;

  return {
    status: response.status,
    body,
    cookie: extractCookie(response),
  };
}

function dataOf<T>(result: ApiResult): T {
  const data = result.body.data as T | undefined;
  assert.ok(data, `Expected data in response: ${JSON.stringify(result.body)}`);
  return data;
}

function errorMessage(result: ApiResult): string {
  return String(result.body.message ?? "");
}

const runId = Date.now().toString(36);

async function register(
  label: string,
): Promise<{ cookie: string; email: string; password: string; userId: string }> {
  const email = `${label}.${runId}@nestora.test`;
  const password = "Password123";
  const response = await api("/api/v1/auth/register", {
    method: "POST",
    body: {
      fullName: `${label} Tester`,
      email,
      password,
      confirmPassword: password,
    },
  });

  assert.equal(response.status, 201, errorMessage(response));
  assert.ok(response.cookie, "Registration should set an auth cookie");

  const data = dataOf<{ user: { id: string } }>(response);
  return { cookie: response.cookie, email, password, userId: data.user.id };
}

async function login(email: string, password: string): Promise<string> {
  const response = await api("/api/v1/auth/login", {
    method: "POST",
    body: { emailOrPhone: email, password },
  });

  assert.equal(response.status, 200, errorMessage(response));
  assert.ok(response.cookie, "Login should set an auth cookie");
  return response.cookie;
}

const pngBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  "base64",
);

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

async function run(): Promise<void> {
  const server = app.listen(0);
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // --- Health + public baseline -------------------------------------------
    const health = await api("/api/v1/health");
    assert.equal(health.status, 200);

    const amenitiesResponse = await api("/api/v1/amenities");
    assert.equal(amenitiesResponse.status, 200);
    const { amenities } = dataOf<{
      amenities: { id: string; name: string; slug: string }[];
    }>(amenitiesResponse);
    assert.ok(amenities.length >= 10, "Default amenities should be seeded");

    // --- Accounts -----------------------------------------------------------
    const host = await register("host");
    const otherHost = await register("otherhost");
    const admin = await register("admin");

    await prisma.user.update({
      where: { id: admin.userId },
      data: { role: "ADMIN" },
    });
    const adminCookie = await login(admin.email, admin.password);

    // --- Authorization basics ----------------------------------------------
    const unauthenticated = await api("/api/v1/host/apartments");
    assert.equal(unauthenticated.status, 401);

    const hostCannotUseAdmin = await api("/api/v1/admin/apartments", {
      cookie: host.cookie,
    });
    assert.equal(hostCannotUseAdmin.status, 403);

    // --- Create draft -------------------------------------------------------
    const createResponse = await api("/api/v1/host/apartments", {
      method: "POST",
      cookie: host.cookie,
      body: {
        title: `Lakeside Test Apartment ${runId}`,
        description:
          "A spacious and comfortable test apartment with modern finishes, fast internet, and a quiet balcony overlooking the neighbourhood.",
        propertyType: "Apartment",
        city: "Lagos",
        location: "Lekki Phase 1",
        address: "12 Test Street, Lekki Phase 1, Lagos",
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 2,
        pricePerNight: 45000,
        cleaningFee: 5000,
        checkInInfo: "Check-in is available from 2:00 PM.",
        checkOutInfo: "Check-out is by 12:00 PM.",
        smokingPolicy: "No smoking",
        petPolicy: "No pets",
        additionalRules: "Quiet hours after 10 PM.",
        amenityIds: [amenities[0].id, amenities[1].id],
      },
    });

    assert.equal(createResponse.status, 201, errorMessage(createResponse));
    const created = dataOf<{ apartment: { id: string; status: string } }>(
      createResponse,
    ).apartment;
    assert.equal(created.status, "DRAFT");

    // --- Ownership enforcement ---------------------------------------------
    const otherHostRead = await api(`/api/v1/host/apartments/${created.id}`, {
      cookie: otherHost.cookie,
    });
    assert.equal(otherHostRead.status, 404);

    const otherHostUpdate = await api(`/api/v1/host/apartments/${created.id}`, {
      method: "PATCH",
      cookie: otherHost.cookie,
      body: { pricePerNight: 99999 },
    });
    assert.equal(otherHostUpdate.status, 404);

    // --- Image upload + validation -----------------------------------------
    const formData = new FormData();
    formData.append(
      "image",
      new Blob([pngBytes], { type: "image/png" }),
      "test-image.png",
    );

    const uploadResponse = await api(
      `/api/v1/host/apartments/${created.id}/images`,
      { method: "POST", cookie: host.cookie, formData },
    );
    assert.equal(uploadResponse.status, 201, errorMessage(uploadResponse));
    const uploaded = dataOf<{
      image: { id: string; url: string; isPrimary: boolean };
    }>(uploadResponse).image;
    assert.equal(uploaded.isPrimary, true);
    assert.ok(uploaded.url.startsWith("/uploads/"));

    const invalidForm = new FormData();
    invalidForm.append(
      "image",
      new Blob([Buffer.from("not an image")], { type: "text/plain" }),
      "bad.txt",
    );
    const invalidUpload = await api(
      `/api/v1/host/apartments/${created.id}/images`,
      { method: "POST", cookie: host.cookie, formData: invalidForm },
    );
    assert.equal(invalidUpload.status, 400);

    // --- Submission + admin review -----------------------------------------
    const submit = await api(`/api/v1/host/apartments/${created.id}/submit`, {
      method: "POST",
      cookie: host.cookie,
    });
    assert.equal(submit.status, 200, errorMessage(submit));

    const publicWhilePending = await api(`/api/v1/apartments/${created.id}`);
    assert.equal(publicWhilePending.status, 404);

    const adminList = await api("/api/v1/admin/apartments?status=PENDING", {
      cookie: adminCookie,
    });
    assert.equal(adminList.status, 200, errorMessage(adminList));
    const adminApartments = dataOf<{ apartments: { id: string }[] }>(
      adminList,
    ).apartments;
    assert.ok(adminApartments.some((apartment) => apartment.id === created.id));

    const rejectWithoutReason = await api(
      `/api/v1/admin/apartments/${created.id}/reject`,
      { method: "POST", cookie: adminCookie, body: {} },
    );
    assert.equal(rejectWithoutReason.status, 400);

    const reject = await api(`/api/v1/admin/apartments/${created.id}/reject`, {
      method: "POST",
      cookie: adminCookie,
      body: { reason: "Please add clearer photos of the bedrooms." },
    });
    assert.equal(reject.status, 200, errorMessage(reject));

    const hostAfterReject = await api(
      `/api/v1/host/apartments/${created.id}`,
      { cookie: host.cookie },
    );
    assert.equal(hostAfterReject.status, 200);
    const rejectedApartment = dataOf<{
      apartment: { status: string; rejectionReason: string | null };
    }>(hostAfterReject).apartment;
    assert.equal(rejectedApartment.status, "REJECTED");
    assert.match(rejectedApartment.rejectionReason ?? "", /bedrooms/i);

    // --- Edit rejected listing, request changes, then approve ---------------
    const editRejected = await api(`/api/v1/host/apartments/${created.id}`, {
      method: "PATCH",
      cookie: host.cookie,
      body: { pricePerNight: 47000 },
    });
    assert.equal(editRejected.status, 200, errorMessage(editRejected));

    const resubmit = await api(`/api/v1/host/apartments/${created.id}/submit`, {
      method: "POST",
      cookie: host.cookie,
    });
    assert.equal(resubmit.status, 200, errorMessage(resubmit));

    const requestChanges = await api(
      `/api/v1/admin/apartments/${created.id}/request-changes`,
      {
        method: "POST",
        cookie: adminCookie,
        body: { reason: "Please confirm the exact neighbourhood and guest limit." },
      },
    );
    assert.equal(requestChanges.status, 200, errorMessage(requestChanges));

    const hostAfterChanges = await api(
      `/api/v1/host/apartments/${created.id}`,
      { cookie: host.cookie },
    );
    const changesApartment = dataOf<{
      apartment: { status: string; reviewNotes: string | null };
    }>(hostAfterChanges).apartment;
    assert.equal(changesApartment.status, "DRAFT");
    assert.match(changesApartment.reviewNotes ?? "", /neighbourhood/i);

    const submitAgain = await api(
      `/api/v1/host/apartments/${created.id}/submit`,
      { method: "POST", cookie: host.cookie },
    );
    assert.equal(submitAgain.status, 200, errorMessage(submitAgain));

    const approve = await api(`/api/v1/admin/apartments/${created.id}/approve`, {
      method: "POST",
      cookie: adminCookie,
    });
    assert.equal(approve.status, 200, errorMessage(approve));

    const publicList = await api("/api/v1/apartments?limit=50");
    assert.equal(publicList.status, 200);
    const publicApartments = dataOf<{
      apartments: { id: string; status: string; mainImage: string | null }[];
    }>(publicList).apartments;
    const published = publicApartments.find(
      (apartment) => apartment.id === created.id,
    );
    assert.ok(published, "Approved apartment should appear publicly");
    assert.equal(published.status, "PUBLISHED");
    assert.ok(published.mainImage);

    const publicDetail = await api(`/api/v1/apartments/${created.id}`);
    assert.equal(publicDetail.status, 200);

    // --- Suspend hides listing ---------------------------------------------
    const suspend = await api(`/api/v1/admin/apartments/${created.id}/suspend`, {
      method: "POST",
      cookie: adminCookie,
      body: { reason: "Temporary administrative suspension for testing." },
    });
    assert.equal(suspend.status, 200, errorMessage(suspend));

    const publicAfterSuspend = await api(`/api/v1/apartments/${created.id}`);
    assert.equal(publicAfterSuspend.status, 404);

    const hostAfterSuspend = await api(
      `/api/v1/host/apartments/${created.id}`,
      { cookie: host.cookie },
    );
    const suspended = dataOf<{
      apartment: { status: string; reviewNotes: string | null };
    }>(hostAfterSuspend).apartment;
    assert.equal(suspended.status, "SUSPENDED");
    assert.match(suspended.reviewNotes ?? "", /suspension/i);

    // --- Editing a suspended listing sends it back for review ---------------
    const editSuspended = await api(`/api/v1/host/apartments/${created.id}`, {
      method: "PATCH",
      cookie: host.cookie,
      body: { cleaningFee: 3500 },
    });
    assert.equal(editSuspended.status, 200, errorMessage(editSuspended));
    const backToPending = dataOf<{ apartment: { status: string } }>(
      editSuspended,
    ).apartment;
    assert.equal(backToPending.status, "PENDING");

    const approveAgain = await api(
      `/api/v1/admin/apartments/${created.id}/approve`,
      { method: "POST", cookie: adminCookie },
    );
    assert.equal(approveAgain.status, 200, errorMessage(approveAgain));

    // --- Archive hides listing ---------------------------------------------
    const archive = await api(`/api/v1/admin/apartments/${created.id}/archive`, {
      method: "POST",
      cookie: adminCookie,
    });
    assert.equal(archive.status, 200, errorMessage(archive));

    const publicAfterArchive = await api(`/api/v1/apartments/${created.id}`);
    assert.equal(publicAfterArchive.status, 404);

    // --- Stats + pagination ------------------------------------------------
    const hostStats = await api("/api/v1/host/apartments/stats", {
      cookie: host.cookie,
    });
    assert.equal(hostStats.status, 200);
    const stats = dataOf<{
      stats: { total: number; archived: number; recent: unknown[] };
    }>(hostStats).stats;
    assert.ok(stats.total >= 1);
    assert.ok(stats.archived >= 1);
    assert.ok(Array.isArray(stats.recent));

    const adminStats = await api("/api/v1/admin/apartments/stats", {
      cookie: adminCookie,
    });
    assert.equal(adminStats.status, 200);
    const adminStatsData = dataOf<{ stats: { total: number } }>(adminStats).stats;
    assert.ok(adminStatsData.total >= 1);

    const paginated = await api(
      "/api/v1/host/apartments?page=1&limit=1",
      { cookie: host.cookie },
    );
    assert.equal(paginated.status, 200);
    const meta = paginated.body.meta as
      | { page: number; limit: number; total: number; totalPages: number }
      | undefined;
    assert.ok(meta);
    assert.equal(meta.page, 1);
    assert.equal(meta.limit, 1);

    console.info("Phase 4 apartment API tests passed.");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
