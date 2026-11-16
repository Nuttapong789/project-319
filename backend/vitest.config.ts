import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./tests/global-setup.ts"],
    setupFiles: ["./tests/setup-env.ts"],
    fileParallelism: false, // ฐานข้อมูลทดสอบมีก้อนเดียว ให้ไฟล์เทสต์รันทีละไฟล์
    testTimeout: 20_000,
  },
});
