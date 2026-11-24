import { describe, expect, it } from "vitest";
import { normalizeAffiliateEmail, parseAffiliateApplication } from "./affiliate-application";

const validApplication = {
  fullName: "Alex Affiliate",
  email: "  Alex@Example.com ",
  phone: "+1 555 555 0100",
  message: "I would like to promote Godaapp courses.",
  termsAccepted: true,
};

describe("affiliate application input", () => {
  it("normalizes the email and trims submitted text", () => {
    expect(normalizeAffiliateEmail("  Alex@Example.com ")).toBe("alex@example.com");
    expect(parseAffiliateApplication(validApplication)).toEqual({
      fullName: "Alex Affiliate",
      email: "alex@example.com",
      phone: "+1 555 555 0100",
      message: "I would like to promote Godaapp courses.",
    });
  });

  it.each([
    [{ ...validApplication, termsAccepted: false }],
    [{ ...validApplication, email: "not-an-email" }],
    [{ ...validApplication, message: "short" }],
    [{ ...validApplication, fullName: " " }],
    [null],
  ])("rejects invalid application data: %j", (input) => {
    expect(parseAffiliateApplication(input)).toBeNull();
  });
});
