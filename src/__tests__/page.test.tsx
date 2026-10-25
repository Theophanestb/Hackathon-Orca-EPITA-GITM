import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("landing page", () => {
  it("shows the app name and the privacy badge", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: "Lab Report Analyzer" })).toBeInTheDocument();
    expect(screen.getByText("Privacy: your data never leaves your device")).toBeInTheDocument();
  });
});
