import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";

import { AppController } from "../src/app.controller.js";

describe("AppController", () => {
  it("returns the service health contract", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    expect(moduleRef.get(AppController).getHealth()).toEqual({
      service: "agentflow-backend",
      status: "ok",
    });
  });
});
