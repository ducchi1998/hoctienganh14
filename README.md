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


## Khôi phục mật khẩu

Website có liên kết **Quên mật khẩu?** trong cửa sổ đăng nhập. Khi triển khai, hãy đưa cả `reset-password.html` lên cùng thư mục với `index.html`, `app.js` và `style.css`.

Trong Supabase, mở **Authentication → URL Configuration → Redirect URLs** và thêm chính xác URL khôi phục sau khi deploy, ví dụ `https://TEN-MIEN-CUA-BAN/reset-password.html` (thay bằng domain Netlify thật đang dùng). Đảm bảo URL website cũng nằm trong danh sách Redirect URLs.

Người dùng chọn **Quên mật khẩu?**, nhập email đăng ký, mở email khôi phục và tạo mật khẩu mới. Nếu chưa nhận email, kiểm tra thư rác và cấu hình email trong Supabase. Liên kết khôi phục có thể hết hạn; khi đó hãy yêu cầu gửi liên kết mới.

## Bảng điều khiển giáo viên

Sau khi đăng nhập bằng tài khoản có vai trò teacher, nút **Quản trị bài học** sẽ xuất hiện trong khu vực thư viện. Từ đây giáo viên có thể:
- Xem tổng số bài học, số bài có video và số bài có tài liệu.
- Tìm kiếm nội dung đã đăng.
- Mở bài học để xem nội dung.
- Chỉnh sửa tiêu đề, danh mục, khối lớp, mô tả, liên kết tài liệu và liên kết YouTube.
- Tải video MP4 mới để thay video hiện tại.
- Xóa bài học cùng video MP4 đã lưu trong bucket riêng tư.

Quyền thêm, sửa, xóa vẫn dựa trên vai trò giáo viên trong public.profiles và chính sách Row Level Security của Supabase. Sau khi cập nhật mã nguồn trên GitHub, hãy chờ Netlify triển khai xong rồi tải lại trang bằng Ctrl + F5.
 
## Bài trắc nghiệm và chấm điểm tự động

**Bắt buộc sau khi cập nhật mã nguồn:** mở Supabase → SQL Editor và chạy phần SQL mới cho bài trắc nghiệm ở cuối file `supabase.sql`. Có thể dán và chạy toàn bộ file để tạo bảng, chính sách RLS và hai hàm RPC.

- Giáo viên đăng nhập, mở **Quản trị bài học**, chọn **Trắc nghiệm** bên cạnh bài học cần tạo.
- Nhập tên bài, thêm câu hỏi, điền đủ 4 lựa chọn và chọn đáp án đúng, sau đó lưu.
- Học sinh đăng nhập, mở bài học và chọn **Làm bài trắc nghiệm** để trả lời và nộp bài.
- Hệ thống tự động chấm điểm, lưu các lần làm bài và hiển thị kết quả.
- Đáp án đúng không được gửi tới trình duyệt học sinh; việc chấm điểm chạy trong Supabase.

Mặc định mỗi câu đúng được 1 điểm. Điểm phần trăm = số câu đúng / tổng số câu × 100. Giáo viên có thể xem các lượt làm bài trong hộp thoại quản lý trắc nghiệm.
