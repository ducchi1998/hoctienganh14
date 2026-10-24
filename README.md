# Góc Học Tập — website bài học

Website responsive tiếng Việt, có:
- Tài khoản đăng nhập / đăng ký cho học sinh.
- Giáo viên đăng bài, chọn môn/danh mục, khối lớp, mô tả.
- Link tài liệu PDF/Word/Google Drive và video YouTube.
- Tìm kiếm, lọc danh mục, giao diện phù hợp điện thoại.
- Phân quyền bằng Supabase: học sinh xem bài; giáo viên được đăng và xóa bài.

## Cần làm một lần để website hoạt động online cho nhiều người

### 1. Tạo backend miễn phí với Supabase
1. Tạo dự án tại https://supabase.com.
2. Vào **SQL Editor**, tạo query mới, dán toàn bộ nội dung file `supabase.sql`, rồi bấm Run.
3. Vào **Project Settings → API** (hoặc phần Connect của dự án), sao chép **Project URL** và **anon/public key**.
4. Mở `app.js`, thay:
   - `PASTE_SUPABASE_PROJECT_URL_HERE` bằng Project URL.
   - `PASTE_SUPABASE_ANON_KEY_HERE` bằng anon/public key.
   Chỉ dùng anon/public key ở trình duyệt. Tuyệt đối không đưa `service_role` key vào website.
5. Vào **Authentication → URL Configuration** trong Supabase, sau khi deploy hãy thêm URL website vào Site URL / Redirect URLs.

### 2. Tạo tài khoản giáo viên
1. Mở website, chọn **Đăng nhập → Tạo tài khoản**, đăng ký bằng email của giáo viên.
2. Xác nhận email nếu Supabase yêu cầu.
3. Trong Supabase → SQL Editor, chạy câu lệnh dưới đây, thay email mẫu bằng email giáo viên:
   ```sql
   update public.profiles p
   set role = 'teacher'
   from auth.users u
   where p.id = u.id and u.email = 'giaovien@example.com';
   ```
4. Đăng xuất rồi đăng nhập lại. Nút **Thêm bài học** sẽ xuất hiện.
5. Học sinh tự tạo tài khoản bằng nút **Tạo tài khoản** và đăng nhập để xem thư viện.

### 3. Đưa website lên mạng miễn phí bằng Netlify
1. Tạo tài khoản tại https://www.netlify.com.
2. Kéo thả thư mục website (chứa `index.html`, `style.css`, `app.js`) vào mục deploy thủ công của Netlify hoặc đưa các file lên GitHub rồi kết nối repository.
3. Sau khi deploy, Netlify cấp một đường link công khai để gửi cho học sinh.
4. Thêm link Netlify vào Supabase Authentication → URL Configuration.

## Lưu ý
- Nếu chưa cấu hình Supabase, website chỉ hiển thị giao diện bản mẫu; đăng nhập và lưu bài học chưa hoạt động.
- Bản khởi đầu lưu đường dẫn tài liệu/video, không tải file lên hệ thống. Có thể dùng Google Drive/OneDrive với quyền chia sẻ phù hợp.
- Mặc định bài học chỉ đọc được sau khi học sinh đăng nhập. Nếu muốn cho khách chưa đăng nhập xem bài, cần điều chỉnh chính sách RLS.
- Không đưa khóa bí mật/service-role vào `app.js` hoặc GitHub.
