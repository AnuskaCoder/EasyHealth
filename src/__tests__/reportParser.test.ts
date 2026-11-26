import { describe, it, expect } from "vitest";
import { parseReportText, generateSummary } from "../services/reportParser";

describe("reportParser", () => {
  it("extracts hemoglobin and marks as Low", () => {
    const text = "Hemoglobin  11.4  g/dL  12.0-15.5\nTotal Leucocyte Count  7200  /cumm  4000-11000";
    const params = parseReportText(text);
    const hb = params.find(p => p.parameter === "Hemoglobin");
    expect(hb).toBeDefined();
    expect(hb?.value).toBe("11.4");
    expect(hb?.status).toBe("Low");
  });

  it("marks normal cholesterol correctly", () => {
    const text = "Total Cholesterol  185  mg/dL  < 200";
    const params = parseReportText(text);
    const chol = params.find(p => p.parameter === "Total Cholesterol");
    expect(chol).toBeDefined();
    expect(chol?.status).toBe("Normal");
  });

  it("marks high cholesterol correctly", () => {
    const text = "Total Cholesterol  260  mg/dL  < 200";
    const params = parseReportText(text);
    const chol = params.find(p => p.parameter === "Total Cholesterol");
    expect(chol?.status).toBe("High");
  });

  it("extracts multiple parameters from a full CBC", () => {
    const text = `
      Hemoglobin: 13.5 g/dL
      WBC Count: 6500 /uL
      Platelet Count: 220000 /uL
      Fasting Blood Glucose: 98 mg/dL
      TSH: 2.1 mIU/L
    `;
    const params = parseReportText(text);
    expect(params.length).toBeGreaterThanOrEqual(4);
  });

  it("generates a summary mentioning abnormal values", () => {
    const params = [
      { parameter: "Hemoglobin", value: "10.0", unit: "g/dL", referenceRange: "12-15.5", status: "Low" as const, explanation: "" },
      { parameter: "Total Cholesterol", value: "160", unit: "mg/dL", referenceRange: "< 200", status: "Normal" as const, explanation: "" },
    ];
    const summary = generateSummary(params, "CBC Test");
    expect(summary).toContain("Hemoglobin");
    expect(summary.length).toBeGreaterThan(30);
  });

  it("generates a positive summary for all-normal results", () => {
    const params = [
      { parameter: "Hemoglobin", value: "14.0", unit: "g/dL", referenceRange: "12-15.5", status: "Normal" as const, explanation: "" },
    ];
    const summary = generateSummary(params, "CBC Test");
    expect(summary.toLowerCase()).toMatch(/normal|healthy|good|within/);
  });

  it("returns empty array for unrecognised text", () => {
    const params = parseReportText("Invoice No: 12345 Date: 2026-01-01 Amount: Rs.500");
    expect(params.length).toBe(0);
  });
});
