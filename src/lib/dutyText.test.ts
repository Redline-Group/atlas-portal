import { describe, it, expect } from "vitest";
import { firstLine, dutySnippet } from "./dutyText";

describe("firstLine", () => {
  it("returns the first non-empty line for ordinary content", () => {
    expect(firstLine("The Prime Agent notifies GovOps.\n\nMore detail.")).toBe(
      "The Prime Agent notifies GovOps.",
    );
  });

  it("falls back to the Responsible Party + Trigger bullets when the first line is the process-step boilerplate header", () => {
    // A.2.2.9.1.2.3.3.4.2.1 shape
    const content =
      "The Document is updated as follows:\n\n- Updated fields\n    - Invocation Status\n        - New value: `Proposal Pending Facilitator Review`\n- Responsible Party: Operational GovOps\n- Triggers: [A.2.2.9.1.2.3.4 - Process Definition For Operational Facilitator Review](fd9aac63-00a0-4fc5-ad7c-8bb131322bd7).";
    expect(firstLine(content)).toBe(
      "Responsible Party: Operational GovOps · Trigger: A.2.2.9.1.2.3.4 - Process Definition For Operational Facilitator Review",
    );
  });

  it("falls back to just Responsible Party when there is no Trigger line", () => {
    // A.2.2.9.1.2.3.2.4.2.1 shape
    const content =
      "The Document is updated as follows.\n\n- Updated fields\n    - `Tracking Methodology`\n        - New Value: as applicable, update to reflect any changes\n    - Responsible Party: Operational GovOps";
    expect(firstLine(content)).toBe("Responsible Party: Operational GovOps");
  });

  it("keeps an [automated] marker in the fallback summary", () => {
    const content =
      "The Document in the Agent Artifact is updated as follows:\n\n- Updated fields\n    - Status\n- Responsible Party: Operational GovOps [automated]\n- Triggers: [A.2.2.9.1.2.3.3 - Process Definition](240e0e2c-64b6-4290-aa23-ec19eb2f6e59).";
    expect(firstLine(content)).toContain("Operational GovOps [automated]");
  });

  it("does not touch ordinary process-step docs whose first line is already informative", () => {
    const content = "Core GovOps executes a payment to the Prime Agent for the amount due.";
    expect(firstLine(content)).toBe(content);
  });

  it("reads the bullets under a header that leads with a condition, and keeps a header naming a linked list", () => {
    const created =
      "After Operational GovOps confirms that the request is feasible, the Document is created as follows.\n\n- Fields\n    - Invocation Status\n        - New value: set to `Proposal drafting in progress`\n- Responsible Party: Operational GovOps\n- Trigger - Process: [A.2.2.9.1.2.3.3 - Process Definition For Artifact Update Draft](240e0e2c-64b6-4290-aa23-ec19eb2f6e59)";
    expect(firstLine(created)).toBe("Responsible Party: Operational GovOps · Trigger: A.2.2.9.1.2.3.3 - Process Definition For Artifact Update Draft");
    const list =
      "[A.2.2.9.1.2.1.4.2.0.6.1 - List Of Onboarding Integrators](eb644108-94fc-430f-ae5a-e3294b9dd9be) is updated as follows:\n\n- Required Primitive Input Trigger: Proposal Fails (see [A.2.2.9.1.2.3.5.3 - Required Primitive Inputs](b593ff77-2c46-418d-a7b3-9730437ce804))\n- Updated fields\n    - `Onboarding Integrators`\n        - New value: Delete the Integrator.\n- Responsible Party: Operational GovOps\n- Trigger - Process: None";
    expect(firstLine(list)).toBe("A.2.2.9.1.2.1.4.2.0.6.1 - List Of Onboarding Integrators is updated as follows:");
  });

  it("falls back to the plain boilerplate line when no RP/Trigger bullet can be found at all", () => {
    expect(firstLine("The Document is updated as follows.\n\nNo bullets here.")).toBe(
      "The Document is updated as follows.",
    );
  });
});

describe("dutySnippet", () => {
  it("prefers the unit naming the role, skipping a bare Responsible Party declaration", () => {
    const content = "Intro sentence.\n\nThe Responsible Party is Operational GovOps.\n\nOperational GovOps reviews the update.";
    expect(dutySnippet(content, /GovOps/i)).toContain("Operational GovOps reviews the update.");
  });
});
