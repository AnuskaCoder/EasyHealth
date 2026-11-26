import { describe, it, expect } from "vitest";
import { processClinicalQuery } from "../services/clinicalAiEngine";
import { PatientProfile } from "../types";

const mockProfile: PatientProfile = {
  id: "p1", name: "Ananya Krishnan", age: 28, gender: "Female",
  dob: "1996-03-15", phone: "9876543210", email: "test@test.com",
  bloodGroup: "B+", height: 164, weight: 58,
  allergies: ["Penicillin", "Dust Mites"],
  chronicConditions: ["Mild Bronchial Asthma"],
  emergencyContact: "9876543210",
};

describe("clinicalAiEngine", () => {
  it("responds to any query with non-empty answer", () => {
    const result = processClinicalQuery("hello", { profile: mockProfile, reports: [], medications: [] });
    expect(result.answer.length).toBeGreaterThan(50);
  });

  it("includes a category in every response", () => {
    const result = processClinicalQuery("my blood test", { profile: mockProfile, reports: [], medications: [] });
    expect(result.category).toBeTruthy();
  });

  it("returns suggested actions", () => {
    const result = processClinicalQuery("I have a fever", { profile: mockProfile, reports: [], medications: [] });
    expect(result.suggestedActions.length).toBeGreaterThan(0);
  });

  it("flags penicillin allergy as emergency", () => {
    const result = processClinicalQuery("can I take amoxicillin", { profile: mockProfile, reports: [], medications: [] });
    expect(result.isEmergency).toBe(true);
    expect(result.answer.toLowerCase()).toMatch(/allergy|contraindication|penicillin/);
  });

  it("warns about NSAIDs with asthma", () => {
    const result = processClinicalQuery("can I take ibuprofen for pain", { profile: mockProfile, reports: [], medications: [] });
    expect(result.answer.toLowerCase()).toMatch(/asthma|nsaid|caution|paracetamol/);
  });

  it("flags cardiac emergency symptoms", () => {
    const result = processClinicalQuery("severe chest pain radiating to left arm with sweating", { profile: mockProfile, reports: [], medications: [] });
    expect(result.isEmergency).toBe(true);
  });

  it("gives health summary with patient name", () => {
    const result = processClinicalQuery("give me my health summary", { profile: mockProfile, reports: [], medications: [] });
    expect(result.answer).toContain("Ananya");
  });

  it("gives fever management advice", () => {
    const result = processClinicalQuery("I have a fever of 102 degrees", { profile: mockProfile, reports: [], medications: [] });
    expect(result.answer.toLowerCase()).toMatch(/paracetamol|temperature|fever/);
  });

  it("gives diabetes advice", () => {
    const result = processClinicalQuery("I have diabetes and my blood sugar is high what should I do", { profile: mockProfile, reports: [], medications: [] });
    expect(result.answer.toLowerCase()).toMatch(/glucose|sugar|diabetes|hba1c|paracetamol|metformin|carb/);
  });

  it("gives cardiac advice for cholesterol query", () => {
    const result = processClinicalQuery("my cholesterol levels are high how to reduce them", { profile: mockProfile, reports: [], medications: [] });
    expect(result.answer.toLowerCase()).toMatch(/cholesterol|ldl|hdl|cardiac|heart|diet|dash/);
  });

  it("offers relevant next steps for dizziness instead of generic help", () => {
    const result = processClinicalQuery("I have been feeling dizzy", { profile: mockProfile, reports: [], medications: [] });
    expect(result.category).toMatch(/Dizziness/);
    expect(result.answer.toLowerCase()).toMatch(/sit or lie down|dizziness/);
  });

  it("flags severe breathing difficulty as an emergency", () => {
    const result = processClinicalQuery("I can't breathe and my lips look blue", { profile: mockProfile, reports: [], medications: [] });
    expect(result.isEmergency).toBe(true);
    expect(result.answer).toMatch(/112|108/);
  });

  it("asks for useful details when it cannot answer specifically", () => {
    const result = processClinicalQuery("Can you explain this?", { profile: mockProfile, reports: [], medications: [] });
    expect(result.answer).toMatch(/don't have enough information/i);
    expect(result.answer).toMatch(/when it started/i);
  });
});
