import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth, type AdminUser } from "@/lib/admin-auth";
import { Button } from "@/components/ui/Button";
import {
  LockIcon,
  UserIcon,
  EyeIcon,
  EyeOffIcon,
} from "@/components/ui/icons";

interface AdminLoginFormProps {
  onSuccess: (user: AdminUser) => void;
}

export function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const { loginAsync } = useAdminAuth();
  const [form, setForm] = useState({
    username: "",
    password: "",
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    // Đợi 1 frame nhỏ để giao diện kịp chuyển sang trạng thái "Đang xác thực..."
    await new Promise((r) => setTimeout(r, 60));

    const result = await loginAsync(form.username, form.password, form.rememberMe);
    if (!result.success || !result.user) {
      setLoginError(result.error ?? "Đăng nhập thất bại.");
      setIsLoggingIn(false);
    } else {
      setIsLoggingIn(false);
      onSuccess(result.user);
    }
  };

  return (
    <div className="container-page min-h-[80vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md rounded-hair border border-sand-300 bg-sand-50 p-8 shadow-xl animate-reveal-up">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lagoon-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-lagoon-800">
            <LockIcon className="h-3.5 w-3.5" />
            Bảo mật hệ thống
          </span>
          <h1 className="mt-4 font-display text-2xl text-ink-900">
            Đăng nhập Quản Trị Viên
          </h1>
          <p className="mt-2 text-xs text-ink-600">
            Truy cập bảng điều khiển sản phẩm, danh mục, khuyến mãi và đơn hàng LiseaMade.
          </p>
        </div>

        {loginError && (
          <div
            role="alert"
            className="mt-6 rounded-hair border border-coral-300 bg-coral-50 p-3 text-xs font-medium text-coral-800 animate-fade-in"
          >
            {loginError}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-username" className="block text-xs font-medium text-ink-800 mb-1">
              Tên đăng nhập
            </label>
            <div className="relative">
              <input
                id="admin-username"
                type="text"
                required
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="admin"
                className="w-full rounded-hair border border-sand-300 bg-sand-50 px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none"
              />
              <UserIcon className="absolute right-3 top-3 h-4 w-4 text-ink-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-medium text-ink-800 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full rounded-hair border border-sand-300 bg-sand-50 px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-ink-400 hover:text-ink-800"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-700">
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
                className="h-4 w-4 rounded accent-ink-900"
              />
              <span>Ghi nhớ phiên đăng nhập</span>
            </label>
          </div>

          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={isLoggingIn}
            className="w-full justify-center"
          >
            {isLoggingIn ? "Đang xác thực..." : "Đăng nhập hệ thống"}
          </Button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 border-t border-sand-200 pt-4 text-center">
          <p className="text-2xs text-ink-500 flex items-center justify-center gap-1.5">
            <LockIcon className="h-3 w-3 text-ink-400" />
            <span>Khu vực quản trị nội bộ bảo mật. Mọi lượt truy cập đều được giám sát.</span>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/san-pham"
            className="text-xs text-ink-600 hover:text-ink-900 underline-reveal"
          >
            ← Quay lại cửa hàng LiseaMade
          </Link>
        </div>
      </div>
    </div>
  );
}
