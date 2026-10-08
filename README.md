# liveness-demo

Web demo để kiểm tra **active liveness** khuôn mặt ngay trên trình duyệt. Có 2 engine, chuyển qua lại trên UI:

| Engine | Mô tả |
|---|---|
| **MediaPipe** | Dùng Face Landmarker (`@mediapipe/tasks-vision`) chạy hoàn toàn ở client. Bước đầu là nhìn thẳng để lấy ảnh frontal, sau đó là 3 thử thách ngẫu nhiên: chớp mắt, quay trái, quay phải, mỉm cười. |
| **TVWebSDK** | Dùng SDK của Trusting Social (`@tsocial/tvweb-sdk@5.13.6`), port từ `onboarding-trust-data-webview` (PVCB). SDK tự dựng UI camera. |

Kết quả của cả 2 engine có cùng shape `LivenessResult` (gồm ảnh frontal và ảnh từng cử chỉ). Màn kết quả cho tải xuống payload JSON `{ frontal: [base64], gesture: [{ base64, gesture }] }`, cùng format với onboarding PVCB.

> ⚠️ **Đây chỉ là demo phía client.** Engine chỉ xác nhận người dùng đã làm đúng thao tác. Muốn kết luận người thật hay giả mạo (ảnh in, màn hình replay, deepfake) thì cần backend chấm điểm trên ảnh/frame đã thu được, ví dụ qua TrustVision API như bên PVCB.

## Chạy

```bash
yarn install
yarn dev          # http://localhost:3000 — trình duyệt chỉ cho mở camera trên localhost hoặc HTTPS
yarn dev:https    # HTTPS tự ký, mở trên điện thoại cùng mạng LAN: https://<ip-máy>:3000
```

Scripts khác: `yarn typecheck`, `yarn lint`, `yarn format`, `yarn build`.

## Cấu hình

Xem `.env.example`. Các biến `NEXT_PUBLIC_*` được inline lúc build, nên đổi giá trị là phải build lại. File env cho từng môi trường để ở `deploy/<env>/.env`.

- `NEXT_PUBLIC_MEDIAPIPE_WASM_ROOT`, `NEXT_PUBLIC_MEDIAPIPE_FACE_MODEL_URL`: mặc định lấy từ jsDelivr / Google Storage. Muốn self-host thì đổi 2 biến này.
- `NEXT_PUBLIC_TVWEB_SDK_URL`, `NEXT_PUBLIC_TVWEB_ASSET_ROOT`, `NEXT_PUBLIC_TVWEB_RESOURCE_ROOT`: TVWebSDK là SDK thương mại. PVCB đang trỏ asset về CDN riêng của họ, nên trước khi dùng thật cần xin license và CDN từ Trusting Social.
  - Nếu không có `resourceRoot`, model blazeface sẽ lấy từ `public/models/blazeface/`. URL mặc định của SDK (TF Hub trên `storage.googleapis.com`) đã trả 403. Tracking (log event) của SDK được tắt bằng `logCredentials: { enable: false }`.
- `NEXT_PUBLIC_BASE_PATH`: dùng khi deploy dưới subpath.

Các ngưỡng thử thách (số bước, timeout) nằm ở `configs/liveness.ts`. Ngưỡng nhận diện cử chỉ nằm ở `lib/liveness/mediapipe/challenges.ts`.

## Cấu trúc

```
app/page.tsx, main.tsx              # màn demo: chọn engine → hướng dẫn → chạy → kết quả
components/liveness/                # guide, mediapipe-runner, tvweb-runner, result-view
configs/liveness.ts                 # URL CDN, timeout
lib/liveness/
  types.ts                          # LivenessResult, RunnerProps, toPayload
  store.ts                          # zustand: engine, phase, result
  messages.ts                       # thông báo lỗi tiếng Việt
  mediapipe/analyze.ts              # landmark → box / yaw / blink / smile + kiểm tra chất lượng
  mediapipe/challenges.ts           # luật từng thử thách + sinh chuỗi ngẫu nhiên
  mediapipe/session.ts              # vòng lặp detect từng frame, chụp ảnh, timeout
  tvweb/sdk.ts                      # nạp và chạy TVWebSDK
```

Muốn thêm engine mới: viết một component nhận `RunnerProps` (`onDone` / `onError` / `onCancel`), trả về `LivenessResult`, rồi khai báo vào `ENGINES` trong `app/main.tsx`.

## Docker

```bash
docker build --build-arg ENV=dev -t liveness-demo .
docker run -p 3000:3000 liveness-demo
```
