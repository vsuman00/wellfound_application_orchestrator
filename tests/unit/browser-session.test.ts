import { describe, expect, it } from "vitest";
import { classifySessionHealth, profileLockCandidates } from "../../src/browser/session.js";

describe("managed browser session health", () => {
  it("classifies a logged-in profile as ready", () => {
    expect(classifySessionHealth({
      profileExists: true,
      loggedIn: true,
      verificationRequired: false,
      lockDetected: false,
      corrupt: false
    })).toBe("ready");
  });

  it("reports safe failure states before ready", () => {
    expect(classifySessionHealth({ profileExists: false, loggedIn: false, verificationRequired: false, lockDetected: false, corrupt: false }))
      .toBe("logged-out");
    expect(classifySessionHealth({ profileExists: true, loggedIn: false, verificationRequired: true, lockDetected: false, corrupt: false }))
      .toBe("verification-required");
    expect(classifySessionHealth({ profileExists: true, loggedIn: true, verificationRequired: false, lockDetected: true, corrupt: false }))
      .toBe("locked");
    expect(classifySessionHealth({ profileExists: true, loggedIn: true, verificationRequired: false, lockDetected: false, corrupt: true }))
      .toBe("corrupt");
  });

  it("uses platform profile-lock names without inspecting candidate data", () => {
    expect(profileLockCandidates("darwin")).toEqual(["SingletonLock", "SingletonCookie", "SingletonSocket"]);
    expect(profileLockCandidates("win32")).toEqual(["SingletonLock", "SingletonCookie"]);
  });
});
