import type { TaskTemplateConfig } from './track-creation-types'

export const taskTemplates: TaskTemplateConfig[] = [
  // === 개강 전후 업무 - 트랙 운영 필수 업무 ===
  { id: 'tpl-1', number: 1, category: '개강 전후 업무', subcategory: '트랙 운영 필수 업무', title: '구글드라이브 만들기', driRole: 'operator', frequency: 'once', triggerType: 'opening_d', triggerOffset: -7, priority: 'low', output: '구글 드라이브' },
  { id: 'tpl-2', number: 2, category: '개강 전후 업무', subcategory: '트랙 운영 필수 업무', title: '노션 docs 생성 (수강생독스, 운영진 독스)', driRole: 'operator', frequency: 'once', triggerType: 'opening_d', triggerOffset: -7, priority: 'low', output: '노션 페이지 작성' },
  { id: 'tpl-3', number: 3, category: '개강 전후 업무', subcategory: '트랙 운영 필수 업무', title: 'ZEP 생성 및 기본 공간 세팅', driRole: 'operator', frequency: 'once', triggerType: 'opening_d', triggerOffset: -7, priority: 'high', output: 'ZEP 생성' },
  { id: 'tpl-4', number: 4, category: '개강 전후 업무', subcategory: '트랙 운영 필수 업무', title: '슬랙 세팅', driRole: 'operator', frequency: 'once', triggerType: 'opening_d', triggerOffset: -7, priority: 'high', output: '슬랙 채널 생성' },
  { id: 'tpl-5', number: 5, category: '개강 전후 업무', subcategory: '트랙 운영 필수 업무', title: '개강 D-1 슬랙 공지 및 CRM 대응', driRole: 'operator', frequency: 'once', triggerType: 'opening_d', triggerOffset: -1, priority: 'low', output: '슬랙 공지 발송' },
  { id: 'tpl-6', number: 6, category: '개강 전후 업무', subcategory: '트랙 운영 필수 업무', title: '수강생 페르소나 파악', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'once', triggerType: 'opening_d', triggerOffset: -1, priority: 'medium', estimatedDays: 1, output: '노션 페이지 작성', reviewer: 'operator' },
  { id: 'tpl-7', number: 7, category: '개강 전후 업무', subcategory: '트랙 운영 필수 업무', title: '사전 캠프 이탈 위험 수강생 파악 및 합류 여부 확인', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'once', triggerType: 'opening_d', triggerOffset: -1, priority: 'medium', estimatedDays: 2, output: '노션 페이지 작성', reviewer: 'operator' },
  { id: 'tpl-8', number: 8, category: '개강 전후 업무', subcategory: '트랙 운영 필수 업무', title: '개강 OT 장표 제작 및 OT 진행', driRole: 'operator', subDriRole: 'operator_manager', frequency: 'once', triggerType: 'opening_d', triggerOffset: -7, priority: 'high', output: '노션 페이지 작성', reviewer: 'operator_manager' },
  { id: 'tpl-9', number: 9, category: '개강 전후 업무', subcategory: '트랙 운영 필수 업무', title: '참여자 서약서 발송 및 서명 완료 여부 체크', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'once', triggerType: 'opening_week', triggerOffset: 1, priority: 'high', estimatedDays: 1, output: '노션 페이지 작성', reviewer: 'operator_manager' },
  { id: 'tpl-10', number: 10, category: '개강 전후 업무', subcategory: '트랙 운영 필수 업무', title: 'ZEP 화이트리스트 적용', driRole: 'learning_manager', frequency: 'once', triggerType: 'opening_d', triggerOffset: 0, priority: 'low', estimatedDays: 1, output: 'ZEP 설정' },
  { id: 'tpl-11', number: 11, category: '개강 전후 업무', subcategory: '트랙 운영 필수 업무', title: '시간표 제작', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'once', triggerType: 'opening_d', triggerOffset: -7, priority: 'low', output: '노션 페이지 작성', reviewer: 'operator' },
  { id: 'tpl-12', number: 12, category: '개강 전후 업무', subcategory: '트랙 운영 필수 업무', title: '소프트웨어 지급', driRole: 'learning_manager', subDriRole: 'operator_manager', frequency: 'once', triggerType: 'opening_week', triggerOffset: 1, priority: 'high', estimatedDays: 1, output: '노션 페이지 작성', reviewer: 'operator_manager' },
  { id: 'tpl-13', number: 13, category: '개강 전후 업무', subcategory: '트랙 운영 필수 업무', title: '튜터/매니저 권한 설정', driRole: 'operator_manager', frequency: 'once', triggerType: 'opening_d', triggerOffset: -7, priority: 'high', estimatedDays: 1, output: '벡오피스 권한 변경', reviewer: 'operator' },
  { id: 'tpl-14', number: 14, category: '개강 전후 업무', subcategory: '트랙 운영 필수 업무', title: '강의지급 (to 수강생, 매니저, 튜터)', driRole: 'learning_manager', frequency: 'per_chapter', triggerType: 'chapter_start_d', triggerOffset: -3, priority: 'high' },

  // === 수강생 상태 관리 ===
  { id: 'tpl-15', number: 15, category: '수강생 상태 관리', subcategory: '수강생 상태 기반 대응 업무', title: '이탈 위험군 판단', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'ad_hoc', triggerType: 'ad_hoc', priority: 'medium', estimatedDays: 2, output: '노션 페이지 작성', reviewer: 'operator' },
  { id: 'tpl-16', number: 16, category: '수강생 상태 관리', subcategory: '수강생 상태 기반 대응 업무', title: '면담을 통한 수강생 상태 요약 및 관리', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'ad_hoc', triggerType: 'ad_hoc', priority: 'high', estimatedDays: 1, output: '노션 페이지 작성', reviewer: 'operator' },

  // === 과제/진도 운영 업무 ===
  { id: 'tpl-17', number: 17, category: '과제/진도 운영 업무', subcategory: '트랙 운영 필수 업무', title: '과제, 강의 진행 공지', driRole: 'learning_manager', frequency: 'ad_hoc', triggerType: 'ad_hoc', priority: 'low', estimatedDays: 1, output: '슬랙 공지 발송' },
  { id: 'tpl-18', number: 18, category: '과제/진도 운영 업무', subcategory: '수강생 상태 기반 대응 업무', title: '강의, 과제 진도율 관리', driRole: 'learning_manager', frequency: 'weekly', triggerType: 'weekly', priority: 'low', estimatedDays: 1, output: '슬랙 공지 발송', reviewer: 'operator' },
  { id: 'tpl-19', number: 19, category: '과제/진도 운영 업무', subcategory: '수강생 상태 기반 대응 업무', title: '강의, 과제 진도율 독려', driRole: 'learning_manager', frequency: 'ad_hoc', triggerType: 'ad_hoc', priority: 'low', estimatedDays: 1, output: '면담로그 작성', reviewer: 'operator' },
  { id: 'tpl-20', number: 20, category: '과제/진도 운영 업무', subcategory: '트랙 운영 필수 업무', title: '과제 서면 피드백 작성 안내 (to 튜터)', driRole: 'operator', subDriRole: 'learning_manager', frequency: 'per_chapter', triggerType: 'schedule', priority: 'medium', estimatedDays: 1, output: '슬랙 공지 발송' },
  { id: 'tpl-21', number: 21, category: '과제/진도 운영 업무', subcategory: '수강생 상태 기반 대응 업무', title: '참여도 저하 수강생 대응', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'ad_hoc', triggerType: 'ad_hoc', priority: 'medium', estimatedDays: 1, output: '면담로그 작성', reviewer: 'operator' },

  // === 프로젝트/이벤트 운영 ===
  { id: 'tpl-22', number: 22, category: '프로젝트/이벤트 운영', subcategory: '트랙 운영 필수 업무', title: '프로젝트 일정, 운영 공지', driRole: 'learning_manager', frequency: 'per_chapter', triggerType: 'schedule', priority: 'high', estimatedDays: 1, output: '슬랙 공지 발송', reviewer: 'operator' },
  { id: 'tpl-23', number: 23, category: '프로젝트/이벤트 운영', subcategory: '트랙 운영 필수 업무', title: '프로젝트 발제', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'per_chapter', triggerType: 'schedule', priority: 'high', estimatedDays: 2, output: '노션 페이지 작성', reviewer: 'operator' },
  { id: 'tpl-24', number: 24, category: '프로젝트/이벤트 운영', subcategory: '트랙 운영 필수 업무', title: '프로젝트 주차 순회 운영', driRole: 'learning_manager', frequency: 'ad_hoc', triggerType: 'ad_hoc', priority: 'low', estimatedDays: 1, output: '면담로그 작성' },
  { id: 'tpl-25', number: 25, category: '프로젝트/이벤트 운영', subcategory: '트랙 운영 필수 업무', title: '밍글데이 준비', driRole: 'learning_manager', frequency: 'once', triggerType: 'schedule', priority: 'medium', estimatedDays: 4, output: '노션 페이지 작성', reviewer: 'operator' },
  { id: 'tpl-26', number: 26, category: '프로젝트/이벤트 운영', subcategory: '트랙 운영 필수 업무', title: '밍글데이 운영', driRole: 'learning_manager', frequency: 'once', triggerType: 'schedule', priority: 'medium', estimatedDays: 1 },
  { id: 'tpl-27', number: 27, category: '프로젝트/이벤트 운영', subcategory: '트랙 운영 필수 업무', title: '커리어세션 일정 조율', driRole: 'operator', frequency: 'once', triggerType: 'schedule', priority: 'high', output: '노션 페이지 작성', reviewer: 'operator' },
  { id: 'tpl-28', number: 28, category: '프로젝트/이벤트 운영', subcategory: '트랙 운영 필수 업무', title: '프로젝트 상품 지급', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'once', triggerType: 'schedule', priority: 'high', estimatedDays: 1, output: '노션 페이지 작성', reviewer: 'operator_manager' },
  { id: 'tpl-29', number: 29, category: '프로젝트/이벤트 운영', subcategory: '트랙 운영 필수 업무', title: '팀 편성 (최종 포함)', driRole: 'learning_manager', frequency: 'per_chapter', triggerType: 'schedule', priority: 'high', estimatedDays: 5, output: '노션 페이지 작성', reviewer: 'operator' },
  { id: 'tpl-30', number: 30, category: '프로젝트/이벤트 운영', subcategory: '수강생 상태 기반 대응 업무', title: '프로젝트 중 팀 갈등/이슈 중재', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'ad_hoc', triggerType: 'ad_hoc', priority: 'high', estimatedDays: 2, output: '면담로그 작성', reviewer: 'operator' },

  // === 최종 프로젝트 및 수료 ===
  { id: 'tpl-31', number: 31, category: '최종 프로젝트 및 수료', subcategory: '트랙 운영 필수 업무', title: '최종발표회 기획 (식순, 심사위원/멘토 섭외)', driRole: 'operator', subDriRole: 'operator_manager', frequency: 'once', triggerType: 'closing_d', triggerOffset: -10, priority: 'high', output: '노션 페이지 작성', reviewer: 'operator' },
  { id: 'tpl-32', number: 32, category: '최종 프로젝트 및 수료', subcategory: '트랙 운영 필수 업무', title: '최종발표회 에셋 제작 (초대장, 포스터 등)', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'once', triggerType: 'closing_d', triggerOffset: -10, priority: 'medium', estimatedDays: 7, output: '노션 페이지 작성', reviewer: 'operator' },
  { id: 'tpl-33', number: 33, category: '최종 프로젝트 및 수료', subcategory: '트랙 운영 필수 업무', title: '수료식 준비 (장표, ZEP 세팅)', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'once', triggerType: 'closing_d', triggerOffset: -10, priority: 'high', estimatedDays: 2, output: '노션 페이지 작성', reviewer: 'operator' },
  { id: 'tpl-34', number: 34, category: '최종 프로젝트 및 수료', subcategory: '트랙 운영 필수 업무', title: 'HRD-net 평가 독려', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'once', triggerType: 'closing_d', triggerOffset: 0, priority: 'high', output: '슬랙 공지 발송' },

  // === 데이터 수집 및 분석 ===
  { id: 'tpl-35', number: 35, category: '데이터 수집 및 분석', subcategory: '트랙 운영 필수 업무', title: 'VOC, 고객 니즈 분석 및 리포트 작성', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'ad_hoc', triggerType: 'ad_hoc', priority: 'high', estimatedDays: 2, output: '노션 페이지 작성', reviewer: 'operator' },
  { id: 'tpl-36', number: 36, category: '데이터 수집 및 분석', subcategory: '트랙 운영 필수 업무', title: '커리큘럼/프로젝트 만족도 조사 만들기 및 배포', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'per_chapter', triggerType: 'schedule', priority: 'medium', estimatedDays: 1, output: '노션 페이지 작성', reviewer: 'operator' },
  { id: 'tpl-37', number: 37, category: '데이터 수집 및 분석', subcategory: '트랙 운영 필수 업무', title: '만족도 분석 및 리포트 작성', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'per_chapter', triggerType: 'schedule', priority: 'high', estimatedDays: 2, output: '노션 페이지 작성', reviewer: 'operator' },
  { id: 'tpl-38', number: 38, category: '데이터 수집 및 분석', subcategory: '트랙 운영 필수 업무', title: '실력분석 분석 및 리포트 작성', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'per_chapter', triggerType: 'schedule', priority: 'high', estimatedDays: 2, output: '노션 페이지 작성', reviewer: 'operator' },
  { id: 'tpl-39', number: 39, category: '데이터 수집 및 분석', subcategory: '트랙 운영 필수 업무', title: '다면평가 분석', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'per_chapter', triggerType: 'schedule', priority: 'high', estimatedDays: 3, output: '노션 페이지 작성', reviewer: 'operator' },

  // === 루틴 업무 ===
  { id: 'tpl-40', number: 40, category: '루틴 업무', subcategory: '트랙 운영 필수 업무', title: 'TIL 제출 확인 및 포인트 지급', driRole: 'learning_manager', frequency: 'daily', triggerType: 'daily', priority: 'low', estimatedDays: 1, output: '슬랙 공지 발송' },
  { id: 'tpl-41', number: 41, category: '루틴 업무', subcategory: '트랙 운영 필수 업무', title: '코드카타 운영', driRole: 'learning_manager', frequency: 'daily', triggerType: 'daily', priority: 'low', estimatedDays: 1, output: '슬랙 공지 발송' },
  { id: 'tpl-42', number: 42, category: '루틴 업무', subcategory: '트랙 운영 필수 업무', title: '우수 TIL 선정', driRole: 'learning_manager', frequency: 'weekly', triggerType: 'weekly', priority: 'low', estimatedDays: 1, output: '노션 페이지 작성' },
  { id: 'tpl-43', number: 43, category: '루틴 업무', subcategory: '트랙 운영 필수 업무', title: '출결 확인 및 출결 데이터 입력', driRole: 'learning_manager', frequency: 'daily', triggerType: 'daily', priority: 'high', estimatedDays: 1, output: '노션 페이지 작성', reviewer: 'operator' },
  { id: 'tpl-44', number: 44, category: '루틴 업무', subcategory: '트랙 운영 필수 업무', title: '입·퇴실 공지', driRole: 'learning_manager', frequency: 'daily', triggerType: 'daily', priority: 'low', estimatedDays: 1, output: '슬랙 공지 발송', reviewer: 'operator' },
  { id: 'tpl-45', number: 45, category: '루틴 업무', subcategory: '트랙 운영 필수 업무', title: '데일리 일정 공지', driRole: 'learning_manager', frequency: 'daily', triggerType: 'daily', priority: 'medium', estimatedDays: 1, output: '슬랙 공지 발송' },
  { id: 'tpl-46', number: 46, category: '루틴 업무', subcategory: '트랙 운영 필수 업무', title: '개인 정비 시간 공지', driRole: 'learning_manager', frequency: 'daily', triggerType: 'daily', priority: 'low', output: '슬랙 공지 발송' },
  { id: 'tpl-47', number: 47, category: '루틴 업무', subcategory: '수강생 상태 기반 대응 업무', title: '수강생 결석/조퇴/외출 사유 기록', driRole: 'learning_manager', frequency: 'daily', triggerType: 'daily', priority: 'medium', estimatedDays: 1, output: '노션 페이지 작성' },
  { id: 'tpl-48', number: 48, category: '루틴 업무', subcategory: '수강생 상태 기반 대응 업무', title: '수강생 컨디션 점수 확인 및 1차 컨택', driRole: 'learning_manager', frequency: 'daily', triggerType: 'daily', priority: 'low', estimatedDays: 1, output: '면담로그 작성' },
  { id: 'tpl-49', number: 49, category: '루틴 업무', subcategory: '트랙 운영 필수 업무', title: 'VOC 단순 수집', driRole: 'learning_manager', frequency: 'daily', triggerType: 'daily', priority: 'low', estimatedDays: 1, output: '노션 페이지 작성' },
  { id: 'tpl-50', number: 50, category: '루틴 업무', subcategory: '트랙 운영 필수 업무', title: '튜터 정기 1on1 배정', driRole: 'operator', frequency: 'ad_hoc', triggerType: 'ad_hoc', priority: 'medium', estimatedDays: 2, reviewer: 'operator' },
  { id: 'tpl-51', number: 51, category: '루틴 업무', subcategory: '트랙 운영 필수 업무', title: '다면평가/과제 세팅', driRole: 'learning_manager', frequency: 'per_chapter', triggerType: 'schedule', priority: 'medium', estimatedDays: 1 },
  { id: 'tpl-52', number: 52, category: '루틴 업무', subcategory: '트랙 운영 필수 업무', title: '순회', driRole: 'learning_manager', frequency: 'daily', triggerType: 'daily', priority: 'low', estimatedDays: 1, output: '면담로그 작성' },
  { id: 'tpl-53', number: 53, category: '루틴 업무', subcategory: '트랙 운영 필수 업무', title: '운영진 회의 리드', driRole: 'operator', subDriRole: 'learning_manager', frequency: 'weekly', triggerType: 'weekly', priority: 'medium', output: '노션 페이지 작성', reviewer: 'operator' },

  // === 튜터 관리 업무 ===
  { id: 'tpl-54', number: 54, category: '튜터 관리 업무', subcategory: '트랙 운영 필수 업무', title: '튜터 온보딩 장표 제작 및 교육 일정 세팅', driRole: 'operator_manager', subDriRole: 'operator', frequency: 'once', triggerType: 'opening_d', triggerOffset: -14, priority: 'medium', output: '노션 페이지 작성', reviewer: 'operator' },
  { id: 'tpl-55', number: 55, category: '튜터 관리 업무', subcategory: '트랙 운영 필수 업무', title: '튜터 보수교육 이수증, NCS', driRole: 'operator', frequency: 'once', triggerType: 'opening_d', triggerOffset: -1, priority: 'high', reviewer: 'operator' },
  { id: 'tpl-56', number: 56, category: '튜터 관리 업무', subcategory: '트랙 운영 필수 업무', title: '튜터 관리', driRole: 'operator', subDriRole: 'learning_manager', frequency: 'ad_hoc', triggerType: 'ad_hoc', priority: 'low', output: '노션 페이지 작성', reviewer: 'operator_manager' },

  // === 행정 업무 ===
  { id: 'tpl-57', number: 57, category: '행정 업무', subcategory: '트랙 운영 필수 업무', title: '변경신고 서류 작성', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'ad_hoc', triggerType: 'ad_hoc', priority: 'high', reviewer: 'operator' },
  { id: 'tpl-58', number: 58, category: '행정 업무', subcategory: '트랙 운영 필수 업무', title: '사실확인서 작성/발송', driRole: 'operator', subDriRole: 'operator_manager', frequency: 'ad_hoc', triggerType: 'ad_hoc', priority: 'high', estimatedDays: 1, output: '사실확인서 수집', reviewer: 'operator' },
  { id: 'tpl-59', number: 59, category: '행정 업무', subcategory: '수강생 상태 기반 대응 업무', title: '중도하차자 면담', driRole: 'operator', subDriRole: 'learning_manager', frequency: 'ad_hoc', triggerType: 'ad_hoc', priority: 'high', estimatedDays: 2, output: '면담로그 작성', reviewer: 'operator' },

  // === 환경 관리 및 지원 ===
  { id: 'tpl-60', number: 60, category: '환경 관리 및 지원', subcategory: '트랙 운영 필수 업무', title: '지원금 지급용 수강생 개인정보 수집 및 정리', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'monthly', triggerType: 'monthly', priority: 'high', estimatedDays: 2, output: '노션 페이지 작성', reviewer: 'operator' },
  { id: 'tpl-61', number: 61, category: '환경 관리 및 지원', subcategory: '트랙 운영 필수 업무', title: '제세공과금 처리위한 정보 정리', driRole: 'learning_manager', subDriRole: 'operator', frequency: 'monthly', triggerType: 'monthly', priority: 'high', output: '노션 페이지 작성', reviewer: 'operator_manager' },
  { id: 'tpl-62', number: 62, category: '환경 관리 및 지원', subcategory: '트랙 운영 필수 업무', title: 'Zoom 생성 및 각종 링크 공지', driRole: 'learning_manager', frequency: 'ad_hoc', triggerType: 'ad_hoc', priority: 'medium', estimatedDays: 1, output: '슬랙 공지 발송' },
  { id: 'tpl-63', number: 63, category: '환경 관리 및 지원', subcategory: '트랙 운영 필수 업무', title: '학습 공간 대여 지원', driRole: 'operator_manager', subDriRole: 'learning_manager', frequency: 'ad_hoc', triggerType: 'ad_hoc', priority: 'low', estimatedDays: 1 },
]

export { ROLE_LABELS, ROLE_LABELS_FULL } from './role-labels'

export const FREQUENCY_LABELS: Record<string, string> = {
  once: '1회성',
  ad_hoc: '수시',
  weekly: '주간 반복',
  daily: '매일 반복',
  monthly: '월별',
  per_chapter: '챕터별',
}

export const PRIORITY_LABELS: Record<string, string> = {
  high: '상',
  medium: '중',
  low: '하',
}

export const CATEGORY_LIST = [
  '개강 전후 업무',
  '수강생 상태 관리',
  '과제/진도 운영 업무',
  '프로젝트/이벤트 운영',
  '최종 프로젝트 및 수료',
  '데이터 수집 및 분석',
  '루틴 업무',
  '튜터 관리 업무',
  '행정 업무',
  '환경 관리 및 지원',
]

// --- Tag-based classification (non-exclusive) ---

export type RepeatTag = 'daily' | 'weekly' | 'chapter' | 'monthly'
export type TrackTag = 'pre_opening' | 'first_week' | 'main_course' | 'closing'
export type ScheduleTag = 'adhoc' | 'period'
export type TaskTag = RepeatTag | TrackTag | ScheduleTag

export type TagGroup = 'repeat' | 'track' | 'schedule'

export const TAG_GROUP_LABELS: Record<TagGroup, string> = {
  repeat: '반복',
  track: '트랙',
  schedule: '일정',
}

export const TAG_LABELS: Record<TaskTag, string> = {
  daily: '일별',
  weekly: '주별',
  chapter: '챕터별',
  monthly: '월별',
  pre_opening: '개강전',
  first_week: '개강1주차',
  main_course: '본과정',
  closing: '수료준비',
  adhoc: '수시',
  period: '기간일정',
}

export const TAG_GROUPS: Record<TagGroup, TaskTag[]> = {
  repeat: ['daily', 'weekly', 'chapter', 'monthly'],
  track: ['pre_opening', 'first_week', 'main_course', 'closing'],
  schedule: ['adhoc', 'period'],
}

export function getTaskTags(tpl: TaskTemplateConfig): TaskTag[] {
  const tags: TaskTag[] = []

  // 반복
  if (tpl.frequency === 'daily') tags.push('daily')
  if (tpl.frequency === 'weekly') tags.push('weekly')
  if (tpl.frequency === 'per_chapter') tags.push('chapter')
  if (tpl.frequency === 'monthly') tags.push('monthly')

  // 트랙
  if (tpl.triggerType === 'opening_d' && (tpl.triggerOffset ?? 0) < 0) {
    tags.push('pre_opening')
  }
  if (tpl.triggerType === 'opening_d' && (tpl.triggerOffset ?? 0) >= 0) {
    tags.push('first_week')
  }
  if (tpl.triggerType === 'opening_week') {
    tags.push('first_week')
  }
  if (tpl.triggerType === 'closing_d') {
    tags.push('closing')
  }
  if (['daily', 'weekly', 'monthly', 'per_chapter'].includes(tpl.frequency)) {
    tags.push('main_course')
  }

  // 일정
  if (tpl.frequency === 'ad_hoc' || tpl.triggerType === 'ad_hoc') {
    tags.push('adhoc')
  }
  if (tpl.triggerType === 'schedule') {
    tags.push('period')
  }

  return tags
}

export function tagBelongsToGroup(tag: TaskTag): TagGroup {
  if (['daily', 'weekly', 'chapter', 'monthly'].includes(tag)) return 'repeat'
  if (['pre_opening', 'first_week', 'main_course', 'closing'].includes(tag)) return 'track'
  return 'schedule'
}

// Legacy single-phase (kept for backward compat with task-generator)
export type TaskPhase =
  | 'daily' | 'weekly' | 'monthly' | 'per_chapter'
  | 'track_prep' | 'track_opening' | 'track_closing'
  | 'schedule_event' | 'ad_hoc'

export function getTaskPhase(tpl: TaskTemplateConfig): TaskPhase {
  if (tpl.frequency === 'daily') return 'daily'
  if (tpl.frequency === 'weekly') return 'weekly'
  if (tpl.frequency === 'monthly') return 'monthly'
  if (tpl.frequency === 'per_chapter') return 'per_chapter'
  if (tpl.triggerType === 'closing_d') return 'track_closing'
  if (tpl.triggerType === 'opening_week') return 'track_opening'
  if (tpl.triggerType === 'opening_d') {
    return (tpl.triggerOffset ?? 0) < 0 ? 'track_prep' : 'track_opening'
  }
  if (tpl.triggerType === 'schedule') return 'schedule_event'
  if (tpl.triggerType === 'ad_hoc') return 'ad_hoc'
  return 'ad_hoc'
}
