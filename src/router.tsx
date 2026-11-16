// =========================================================
// React Router v7 — รายชื่อหน้าทั้งหมดของเว็บ
// ทุกหน้าอยู่ใต้ RootLayout (มี Navbar + Footer) และแสดงตรง <Outlet />
// หน้าที่ต้องล็อกอินก่อน ครอบด้วย RequireAuth
// =========================================================

import { createBrowserRouter } from "react-router";
import RequireAuth from "./components/RequireAuth";
import RootLayout from "./layouts/RootLayout";
import AllPetsPage from "./pages/AllPetsPage";
import FavoritesPage from "./pages/FavoritesPage";
import GuidePage from "./pages/GuidePage";
import LoginPage from "./pages/LoginPage";
import MyPage from "./pages/MyPage";
import NotFoundPage from "./pages/NotFoundPage";
import PetDetailPage from "./pages/PetDetailPage";
import PetFormPage from "./pages/PetFormPage";
import PetsPage from "./pages/PetsPage";
import RegisterPage from "./pages/RegisterPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <PetsPage /> }, //            /            หน้าแรก: น้องที่ต้องการบ้านด่วน
      { path: "pets", element: <AllPetsPage /> }, //         /pets        ฟีดน้องทั้งหมด
      { path: "pets/:id", element: <PetDetailPage /> }, //   /pets/3      รายละเอียด + ขอรับเลี้ยง (dynamic)
      { path: "guide", element: <GuidePage /> }, //          /guide       ความรู้เบื้องต้น
      { path: "login", element: <LoginPage /> }, //          /login       เข้าสู่ระบบ
      { path: "register", element: <RegisterPage /> }, //    /register    สมัครสมาชิก

      // ---- ต้องล็อกอินก่อน ----
      {
        element: <RequireAuth />,
        children: [
          { path: "pets/new", element: <PetFormPage /> }, //     /pets/new      โพสต์น้องใหม่
          { path: "pets/:id/edit", element: <PetFormPage /> }, // /pets/3/edit   แก้ไข (เฉพาะเจ้าของ)
          { path: "favorites", element: <FavoritesPage /> }, //  /favorites     รายการโปรด
          { path: "me", element: <MyPage /> }, //                /me            หน้า "ของฉัน"
        ],
      },

      { path: "*", element: <NotFoundPage /> }, //           ลิงก์อื่น ๆ = 404
    ],
  },
]);
