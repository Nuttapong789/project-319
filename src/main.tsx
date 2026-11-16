import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { router } from "./router";
import "./index.css";

// QueryClient = ที่เก็บ cache ของข้อมูลจาก server ทั้งแอป
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // ข้อมูลถือว่ายังใหม่ 1 นาที ไม่ต้องยิง API ซ้ำทุกครั้งที่สลับหน้า
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
