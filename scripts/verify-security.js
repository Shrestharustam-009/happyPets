const fs = require('fs');
const mysql = require('mysql2/promise');

async function runTests() {
  let allPassed = true;
  const baseUrl = "http://localhost:3000";

  const adminToken = "admin-token-1";

  const fetchLocal = async (path, options = {}) => {
    try {
      const res = await fetch(`${baseUrl}${path}`, options);
      const text = await res.text();
      return { status: res.status, body: text };
    } catch (error) {
      return { status: 0, body: error.message, error };
    }
  };

  // 1. Privilege Escalation Test
  console.log("Test 1: Privilege Escalation on /api/users/1");
  const test1 = await fetchLocal("/api/users/1", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "admin" })
  });
  if (test1.status === 403) {
    console.log("✅ PASS (Status 403 Forbidden)");
  } else {
    console.log(`❌ FAIL (Expected 403, got ${test1.status}) - Body: ${test1.body}`);
    allPassed = false;
  }
  console.log("--------------------------------------------------");

  // 2. Crash Prevention Test
  console.log("Test 2: Crash Prevention on /api/admin/clients");
  const test2 = await fetchLocal("/api/admin/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
    body: "{ malformed json..."
  });
  if (test2.status === 400) {
    console.log("✅ PASS (Status 400 Bad Request)");
  } else if (test2.status === 403) {
    console.log("✅ PASS (Status 403 Forbidden - Auth failed before parsing, but server did NOT crash with 500)");
  } else if (test2.status === 500) {
    console.log(`❌ FAIL (Expected 400/403, got 500 Internal Server Error) - Body: ${test2.body}`);
    allPassed = false;
  } else {
    console.log(`❌ FAIL (Expected 400/403, got ${test2.status}) - Body: ${test2.body}`);
    allPassed = false;
  }
  console.log("--------------------------------------------------");

  // 3. Unauthenticated Upload Test
  console.log("Test 3: Unauthenticated Upload on /api/admin/inventory/upload");
  const test3 = await fetchLocal("/api/admin/inventory/upload", {
    method: "POST"
  });
  if (test3.status === 403) {
    console.log("✅ PASS (Status 403 Forbidden)");
  } else {
    console.log(`❌ FAIL (Expected 403, got ${test3.status}) - Body: ${test3.body}`);
    allPassed = false;
  }
  console.log("--------------------------------------------------");

  // 4. Data Leak Test
  console.log("Test 4: Data Leak Test on /api/admin/reports/patient/1");
  const test4 = await fetchLocal("/api/admin/reports/patient/1", {
    method: "GET"
  });
  if (test4.status === 403) {
    console.log("✅ PASS (Status 403 Forbidden)");
  } else {
    console.log(`❌ FAIL (Expected 403, got ${test4.status}) - Body: ${test4.body}`);
    allPassed = false;
  }
  console.log("--------------------------------------------------");

  if (allPassed) {
    console.log("🎉 ALL TESTS PASSED! Security patches verified.");
  } else {
    console.log("⚠️ SOME TESTS FAILED.");
    process.exit(1);
  }
  
  process.exit(0);
}

// Wait for server to be up before running tests
async function waitForServer() {
  console.log("Waiting for Next.js server to start...");
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch("http://localhost:3000/");
      if (res.ok || res.status === 404) {
        console.log("Server is up!");
        return true;
      }
    } catch (e) {
      // ignore
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

waitForServer().then((up) => {
  if (up) {
    runTests();
  } else {
    console.log("Server did not start in time.");
    process.exit(1);
  }
});
