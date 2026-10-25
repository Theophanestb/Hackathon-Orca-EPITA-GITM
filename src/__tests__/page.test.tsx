import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("analyzer page", () => {
  it("shows the input tabs and the privacy badge", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Understand your lab results");
    expect(screen.getByText("Privacy: your data never leaves your device")).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("analyses a sample end to end and clears it", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /analyse this sample/i }));
    expect(screen.getByRole("heading", { level: 1, name: "Your results" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Alerts" })).toBeInTheDocument();
    expect(screen.getByText("No pattern detected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Understand your lab results");
  });
});
