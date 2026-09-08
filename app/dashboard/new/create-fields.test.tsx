import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  FieldError,
  InterviewTypeField,
  SelectField,
  TextAreaField,
  TextField,
} from "./create-fields";

describe("create opportunity fields", () => {
  it("renders a text field with an optional hint", () => {
    render(<TextField id="name" label="Name" hint="Required" />);
    expect(screen.getByTestId("name-input")).toBeInTheDocument();
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByTestId("name-input")).not.toBeRequired();
  });

  it("prefills a text field default", () => {
    render(
      <TextField
        id="candidateDisplayName"
        label="Candidate name"
        defaultValue="Alex"
      />,
    );
    expect(screen.getByTestId("candidateDisplayName-input")).toHaveValue(
      "Alex",
    );
  });

  it("marks a required text field", () => {
    render(
      <TextField id="candidateDisplayName" label="Candidate name" required />,
    );
    expect(screen.getByTestId("candidateDisplayName-input")).toBeRequired();
    expect(
      screen.getByTestId("candidateDisplayName-required"),
    ).toHaveTextContent("*");
  });

  it("renders a textarea for pasted briefing text", () => {
    render(
      <TextAreaField
        id="jobDescription"
        label="Job description"
        hint="Paste the posting"
      />,
    );
    expect(screen.getByTestId("jobDescription-input").tagName).toBe("TEXTAREA");
    expect(screen.getByText("Paste the posting")).toBeInTheDocument();
  });

  it("prefills a textarea default", () => {
    render(
      <TextAreaField
        id="jobDescription"
        label="Job description"
        defaultValue="Paste me"
      />,
    );
    expect(screen.getByTestId("jobDescription-input")).toHaveValue("Paste me");
  });

  it("renders a textarea without a hint", () => {
    render(<TextAreaField id="curriculum" label="Candidate curriculum" />);
    expect(screen.getByTestId("curriculum-input").tagName).toBe("TEXTAREA");
    expect(screen.getByTestId("curriculum-input")).not.toBeRequired();
  });

  it("marks a required textarea", () => {
    render(
      <TextAreaField id="jobDescription" label="Job description" required />,
    );
    expect(screen.getByTestId("jobDescription-input")).toBeRequired();
    expect(screen.getByTestId("jobDescription-required")).toHaveTextContent(
      "*",
    );
  });

  it("hides field errors when the map has no message", () => {
    render(<FieldError errors={{}} field="role" />);
    expect(screen.queryByTestId("field-error-role")).not.toBeInTheDocument();
  });

  it("renders the interview type select", () => {
    render(<InterviewTypeField />);
    expect(screen.getByTestId("interviewType-input")).toHaveValue("behavioral");
  });

  it("renders a select with options and an optional hint", () => {
    render(
      <SelectField
        id="role"
        label="Role"
        defaultValue="fullstack"
        hint="The practice track"
        required
        options={[
          { value: "fullstack", label: "Full stack" },
          { value: "backend", label: "Backend" },
        ]}
      />,
    );
    expect(screen.getByTestId("role-input")).toHaveValue("fullstack");
    expect(screen.getByTestId("role-input")).toBeRequired();
    expect(screen.getByTestId("role-chevron")).toBeInTheDocument();
    expect(screen.getByText("The practice track")).toBeInTheDocument();
  });

  it("renders a select without a hint", () => {
    render(
      <SelectField
        id="seniority"
        label="Seniority"
        defaultValue="medium"
        options={[{ value: "medium", label: "Medium" }]}
      />,
    );
    expect(screen.getByTestId("seniority-input")).toHaveValue("medium");
  });
});
