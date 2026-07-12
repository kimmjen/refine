# 성능 최적화 가이드

대규모 데이터 처리를 위한 최적화 방안입니다.

---

## 📊 중복 검사 성능 이슈

### 현재 구현 방식
- URL 변형들을 생성하여 `.in()` 쿼리로 검색
- 위치: `/pages/api/check-duplicate.ts`

### 규모별 예상 성능

| 데이터 규모 | 인덱스 있음 | 인덱스 없음 |
|------------|-----------|-----------|
| 1천 개 | ~5ms ✅ | ~50ms |
| 10만 개 | ~10ms ✅ | ~500ms |
| 100만 개 | ~20ms ✅ | ~5초 ❌ |
| 1억 개 | ~50ms ✅ | ~10분 ❌ |

---

## 🚀 최적화 단계

### 1단계: URL 인덱스 추가 (10만+ 데이터)

Supabase SQL Editor에서 실행:

```sql
-- url 컬럼에 B-tree 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_shared_links_url 
ON shared_links(url);
```

### 2단계: 정규화 컬럼 추가 (100만+ 데이터)

#### 2-1. 컬럼 추가

```sql
-- 정규화된 URL 컬럼 추가
ALTER TABLE shared_links 
ADD COLUMN IF NOT EXISTS normalized_url TEXT;
```

#### 2-2. 기존 데이터 정규화

```sql
-- 기존 데이터의 normalized_url 채우기
-- (www 제거, 프로토콜 제거, trailing slash 제거, 소문자 변환)
UPDATE shared_links 
SET normalized_url = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(url, '^https?://', ''),
      '^www\.', ''
    ),
    '/$', ''
  )
)
WHERE normalized_url IS NULL;
```

#### 2-3. UNIQUE 인덱스 추가

```sql
-- UNIQUE 인덱스 (DB 레벨에서 중복 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_shared_links_normalized_url 
ON shared_links(normalized_url);
```

### 3단계: API 코드 수정

`/pages/api/check-duplicate.ts` 수정:

```typescript
// 기존: URL 변형 8개로 검색
const urlVariants = getUrlVariants(url);
const { data } = await supabase
  .from('shared_links')
  .in('url', urlVariants)
  .maybeSingle();

// 개선: 정규화된 URL 1개로 검색 (훨씬 빠름)
const normalizedUrl = normalizeUrl(url);
const { data } = await supabase
  .from('shared_links')
  .eq('normalized_url', normalizedUrl)
  .maybeSingle();
```

### 4단계: 저장 시 정규화 URL 함께 저장

`/pages/api/save-shared-content.ts` 수정:

```typescript
const { error } = await supabaseAdmin
  .from('shared_links')
  .insert([{
    url: linkData.url,
    normalized_url: normalizeUrl(linkData.url), // 추가
    title: linkData.title,
    // ... 나머지 필드
  }]);
```

---

## 📋 체크리스트

- [ ] 데이터 1만 개 돌파 시: 인덱스 추가 검토
- [ ] 데이터 10만 개 돌파 시: 인덱스 필수 추가
- [ ] 데이터 100만 개 돌파 시: 정규화 컬럼 + 코드 수정

---

## 🔍 현재 데이터 개수 확인

Supabase SQL Editor에서:

```sql
SELECT COUNT(*) FROM shared_links;
```

---

## 📝 참고

- PostgreSQL B-tree 인덱스는 O(log n) 성능
- UNIQUE 인덱스 사용 시 중복 INSERT 자체가 DB 에러로 방지됨
- 정규화 함수는 서버와 DB에서 동일하게 구현해야 함
