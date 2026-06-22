-- ============================================
-- VIEWS FOR REPORTING & ANALYTICS
-- ============================================

USE PerformaLayanan;
GO

-- ============================================
-- 1. VIEW SUMMARY PER LAYANAN
-- ============================================
IF OBJECT_ID('v_summary_layanan', 'V') IS NOT NULL DROP VIEW v_summary_layanan;
GO

CREATE VIEW v_summary_layanan AS
SELECT 
    l.layanan_id,
    l.layanan_code,
    l.layanan_name,
    
    -- Count metrics
    COUNT(DISTINCT ph.penilaian_id) as total_penilaian,
    COUNT(DISTINCT ph.petugas_id) as total_petugas_dinilai,
    COUNT(DISTINCT ph.no_mr) as total_pasien_unik,
    
    -- Score metrics
    AVG(ph.rating_average) as avg_rating,
    AVG(ph.percentage_score) as avg_percentage,
    MIN(ph.percentage_score) as min_percentage,
    MAX(ph.percentage_score) as max_percentage,
    
    -- Kepuasan breakdown
    SUM(CASE WHEN ph.kategori_kepuasan = 'Sangat Puas' THEN 1 ELSE 0 END) as total_sangat_puas,
    SUM(CASE WHEN ph.kategori_kepuasan = 'Puas' THEN 1 ELSE 0 END) as total_puas,
    SUM(CASE WHEN ph.kategori_kepuasan = 'Cukup Puas' THEN 1 ELSE 0 END) as total_cukup_puas,
    SUM(CASE WHEN ph.kategori_kepuasan = 'Tidak Puas' THEN 1 ELSE 0 END) as total_tidak_puas,
    SUM(CASE WHEN ph.kategori_kepuasan = 'Sangat Tidak Puas' THEN 1 ELSE 0 END) as total_sangat_tidak_puas,
    
    -- Time metrics
    AVG(ph.durasi_pengisian) as avg_durasi_pengisian,
    MAX(ph.tanggal_penilaian) as last_penilaian_date
    
FROM m_layanan_penunjang l
LEFT JOIN t_penilaian_header ph ON l.layanan_id = ph.layanan_id 
    AND ph.status_penilaian = 'submitted'
    AND ph.tanggal_penilaian >= DATEADD(month, -1, GETDATE())
WHERE l.is_active = 1
GROUP BY l.layanan_id, l.layanan_code, l.layanan_name;

GO

PRINT '✅ View v_summary_layanan created';

-- ============================================
-- 2. VIEW SUMMARY PER PETUGAS
-- ============================================
IF OBJECT_ID('v_summary_petugas', 'V') IS NOT NULL DROP VIEW v_summary_petugas;
GO

CREATE VIEW v_summary_petugas AS
SELECT 
    p.petugas_id,
    p.nip,
    p.nama_petugas,
    p.jabatan,
    l.layanan_name,
    l.layanan_code,
    
    -- Count
    COUNT(ph.penilaian_id) as total_penilaian,
    COUNT(DISTINCT ph.no_mr) as total_pasien,
    
    -- Score
    AVG(ph.rating_average) as avg_rating,
    AVG(ph.percentage_score) as avg_percentage,
    
    -- Kepuasan
    SUM(CASE WHEN ph.kategori_kepuasan IN ('Sangat Puas', 'Puas') THEN 1 ELSE 0 END) as total_positif,
    SUM(CASE WHEN ph.kategori_kepuasan IN ('Tidak Puas', 'Sangat Tidak Puas') THEN 1 ELSE 0 END) as total_negatif,
    
    -- Time
    MAX(ph.tanggal_penilaian) as last_penilaian_date,
    MIN(ph.tanggal_penilaian) as first_penilaian_date
    
FROM m_petugas p
LEFT JOIN m_layanan_penunjang l ON p.layanan_id = l.layanan_id
LEFT JOIN t_penilaian_header ph ON p.petugas_id = ph.petugas_id 
    AND ph.status_penilaian = 'submitted'
WHERE p.is_active = 1
GROUP BY p.petugas_id, p.nip, p.nama_petugas, p.jabatan, l.layanan_name, l.layanan_code;

GO

PRINT '✅ View v_summary_petugas created';

-- ============================================
-- 3. VIEW TRENDLINE DAILY
-- ============================================
IF OBJECT_ID('v_trendline_daily', 'V') IS NOT NULL DROP VIEW v_trendline_daily;
GO

CREATE VIEW v_trendline_daily AS
SELECT 
    CAST(ph.tanggal_penilaian AS DATE) as tanggal,
    l.layanan_id,
    l.layanan_name,
    l.layanan_code,
    
    COUNT(ph.penilaian_id) as total_penilaian,
    AVG(ph.rating_average) as avg_rating,
    AVG(ph.percentage_score) as avg_percentage,
    
    SUM(CASE WHEN ph.kategori_kepuasan = 'Sangat Puas' THEN 1 ELSE 0 END) as total_sangat_puas,
    SUM(CASE WHEN ph.kategori_kepuasan = 'Puas' THEN 1 ELSE 0 END) as total_puas,
    
    AVG(ph.durasi_pengisian) as avg_durasi
    
FROM t_penilaian_header ph
INNER JOIN m_layanan_penunjang l ON ph.layanan_id = l.layanan_id
WHERE ph.status_penilaian = 'submitted'
    AND ph.tanggal_penilaian >= DATEADD(day, -30, GETDATE())
GROUP BY CAST(ph.tanggal_penilaian AS DATE), l.layanan_id, l.layanan_name, l.layanan_code;

GO

PRINT '✅ View v_trendline_daily created';

-- ============================================
-- 4. VIEW DETAIL PENILAIAN (untuk export)
-- ============================================
IF OBJECT_ID('v_penilaian_detail_export', 'V') IS NOT NULL DROP VIEW v_penilaian_detail_export;
GO

CREATE VIEW v_penilaian_detail_export AS
SELECT 
    -- Header Info
    ph.penilaian_no,
    ph.tanggal_penilaian,
    ph.no_mr,
    ph.nama_pasien,
    ph.jenis_kelamin,
    
    -- Layanan & Petugas
    l.layanan_name,
    p.nama_petugas as nama_petugas,
    p.nip as nip_petugas,
    p.jabatan,
    
    -- Pertanyaan & Jawaban
    kat.kategori_name,
    per.pertanyaan_text,
    
    CASE 
        WHEN per.template_id IN (1,2,3) THEN CAST(pd.nilai_rating AS VARCHAR)
        WHEN per.template_id = 4 THEN CASE WHEN pd.jawaban_boolean = 1 THEN 'Ya' ELSE 'Tidak' END
        WHEN per.template_id IN (5,6) THEN pd.jawaban_text
        ELSE pd.jawaban_pilihan
    END as jawaban,
    
    pd.komentar,
    
    -- Score
    ph.rating_average,
    ph.percentage_score,
    ph.kategori_kepuasan,
    
    -- Komentar Umum
    ph.komentar_umum,
    ph.saran,
    
    -- Device
    ph.device_type,
    ph.browser_name
    
FROM t_penilaian_header ph
INNER JOIN t_penilaian_detail pd ON ph.penilaian_id = pd.penilaian_id
INNER JOIN m_layanan_penunjang l ON ph.layanan_id = l.layanan_id
INNER JOIN m_petugas p ON ph.petugas_id = p.petugas_id
INNER JOIN m_pertanyaan per ON pd.pertanyaan_id = per.pertanyaan_id
INNER JOIN m_kategori_pertanyaan kat ON per.kategori_id = kat.kategori_id
WHERE ph.status_penilaian = 'submitted';

GO

PRINT '✅ View v_penilaian_detail_export created';

GO

PRINT '';
PRINT '╔════════════════════════════════════════════╗';
PRINT '║  ✅ VIEWS CREATED SUCCESSFULLY             ║';
PRINT '╚════════════════════════════════════════════╝';