// 서버에 저장된 이미지 파일명을, 브라우저가 볼 수 있는 전체 URL로 바꿔주는 함수
// - 이미 완전한 URL(http로 시작)이면 그대로 반환 (식약처 마스터DB 레시피용)
// - 파일명만 있으면 우리 서버 주소를 붙여서 반환 (사용자가 새로 등록한 레시피용)
export function getImageUrl(filename) {
  if (!filename) return '' // 값이 없으면 빈 문자열 (깨진 이미지 아이콘 방지용)

  // 이미 http:// 또는 https://로 시작하면 완전한 URL이므로 그대로 사용
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename
  }

  // 그 외엔 파일명만 있는 것으로 보고 우리 서버 주소를 붙임
  return `/api/uploads/${filename}`
}