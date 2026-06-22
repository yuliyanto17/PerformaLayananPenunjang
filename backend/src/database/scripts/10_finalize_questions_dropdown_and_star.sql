USE PerformaLayanan;

BEGIN TRY
  BEGIN TRAN;

  /* =========================================================
     MANUAL MASTER QUESTIONS SETUP (SINGLE BATCH - NO GO)
     - Dropdown Kepuasan 4 level (nilai 1..4)
     - Rating overall STAR 1..5 di akhir (sort_order=999)
     - Jenis Pelayanan:
         * IRM -> dropdown custom (bobot=0)
         * Patologi Anatomi -> dropdown custom (bobot=0)
         * Patologi Klinik -> free text (bobot=0)
     ========================================================= */

  -- 0) Ambil template_id
  DECLARE @tplDropdown INT = (
    SELECT TOP 1 template_id
    FROM m_template_jawaban
    WHERE tipe_input='dropdown' AND is_active=1
    ORDER BY template_id
  );

  DECLARE @tplRate5 INT = (
    SELECT TOP 1 template_id
    FROM m_template_jawaban
    WHERE tipe_input='rating_5' AND is_active=1
    ORDER BY template_id
  );

  DECLARE @tplTextLong INT = (
    SELECT TOP 1 template_id
    FROM m_template_jawaban
    WHERE tipe_input='text_long' AND is_active=1
    ORDER BY template_id
  );

  IF @tplDropdown IS NULL OR @tplRate5 IS NULL OR @tplTextLong IS NULL
    THROW 51000, 'Template dropdown/rating_5/text_long belum ada. Jalankan seed template terlebih dulu.', 1;

  -- 1) Ambil layanan_id
  DECLARE @RAD  INT = (SELECT layanan_id FROM m_layanan_penunjang WHERE layanan_code='RAD');
  DECLARE @IRM  INT = (SELECT layanan_id FROM m_layanan_penunjang WHERE layanan_code='IRM');
  DECLARE @PATK INT = (SELECT layanan_id FROM m_layanan_penunjang WHERE layanan_code='PATKLINIK');
  DECLARE @PATA INT = (SELECT layanan_id FROM m_layanan_penunjang WHERE layanan_code='PATANATOMI');
  DECLARE @ADM  INT = (SELECT layanan_id FROM m_layanan_penunjang WHERE layanan_code='ADMISI');

  IF @RAD IS NULL OR @IRM IS NULL OR @PATK IS NULL OR @PATA IS NULL OR @ADM IS NULL
    THROW 51001, 'Ada layanan yang belum ada di m_layanan_penunjang. Pastikan master layanan sudah ada.', 1;

  -- 2) Ambil kategori_id (fallback ke 1)
  DECLARE @K_PEL  INT = ISNULL((SELECT kategori_id FROM m_kategori_pertanyaan WHERE kategori_code='PELAYANAN'), 1);
  DECLARE @K_INFO INT = ISNULL((SELECT kategori_id FROM m_kategori_pertanyaan WHERE kategori_code='INFORMASI'), 1);
  DECLARE @K_WAKTU INT= ISNULL((SELECT kategori_id FROM m_kategori_pertanyaan WHERE kategori_code='WAKTU'), 1);
  DECLARE @K_PTG  INT = ISNULL((SELECT kategori_id FROM m_kategori_pertanyaan WHERE kategori_code='PETUGAS'), 1);
  DECLARE @K_FAS  INT = ISNULL((SELECT kategori_id FROM m_kategori_pertanyaan WHERE kategori_code='FASILITAS'), 1);

  -- 3) Reset opsi dropdown -> Kepuasan 4 level (Nilai 1..4)
  DELETE FROM m_opsi_jawaban WHERE template_id = @tplDropdown;

  INSERT INTO m_opsi_jawaban (template_id, nilai, label, sort_order, is_active, color_hex)
  VALUES
  (@tplDropdown, 4, 'Sangat Puas', 1, 1, '#22c55e'),
  (@tplDropdown, 3, 'Puas',        2, 1, '#84cc16'),
  (@tplDropdown, 2, 'Cukup Puas',  3, 1, '#eab308'),
  (@tplDropdown, 1, 'Tidak Puas',  4, 1, '#ef4444');

  PRINT '✅ Opsi Dropdown Kepuasan 4 level OK';

  -- 4) UPSERT pertanyaan performa + rating bintang
  DECLARE @Q TABLE(
    layanan_id INT,
    kategori_id INT,
    pertanyaan_code VARCHAR(50),
    pertanyaan_text NVARCHAR(1000),
    template_id INT,
    has_custom_opsi BIT,
    bobot INT,
    is_required BIT,
    sort_order INT
  );

  -- RADIOLOGI
  INSERT INTO @Q VALUES
  (@RAD,@K_PEL,'RAD_01_PENDAFTARAN',N'Kemudahan proses pendaftaran radiologi',@tplDropdown,0,1,1,1),
  (@RAD,@K_WAKTU,'RAD_02_KECEPATAN',N'Kecepatan pelayanan petugas radiologi',@tplDropdown,0,1,1,2),
  (@RAD,@K_PTG,'RAD_03_KERAMAHAN',N'Keramahan dan sikap petugas radiologi',@tplDropdown,0,1,1,3),
  (@RAD,@K_INFO,'RAD_04_INFO_PROSEDUR',N'Kejelasan informasi tentang prosedur pemeriksaan',@tplDropdown,0,1,1,4),
  (@RAD,@K_FAS,'RAD_05_KEBERSIHAN',N'Kebersihan ruang radiologi',@tplDropdown,0,1,1,5),
  (@RAD,@K_FAS,'RAD_06_KENYAMANAN',N'Kenyamanan ruang tunggu',@tplDropdown,0,1,1,6),
  (@RAD,@K_WAKTU,'RAD_07_KETEPATAN',N'Ketepatan waktu pelayanan pemeriksaan',@tplDropdown,0,1,1,7),
  (@RAD,@K_PTG,'RAD_08_PROFESIONAL',N'Profesionalisme petugas radiologi',@tplDropdown,0,1,1,8),
  (@RAD,@K_PEL,'RAD_09_KEAMANAN',N'Keamanan selama pemeriksaan radiologi',@tplDropdown,0,1,1,9),
  (@RAD,@K_WAKTU,'RAD_10_HASIL',N'Kecepatan hasil pemeriksaan radiologi diterima',@tplDropdown,0,1,1,10),
  (@RAD,@K_PEL,'RAD_99_RATING',N'Penilaian Rating (Bintang) layanan Radiologi secara keseluruhan',@tplRate5,0,1,1,999);

  -- IRM
  INSERT INTO @Q VALUES
  (@IRM,@K_INFO,'IRM_01_INFO',N'Kejelasan informasi pelayanan',@tplDropdown,0,1,1,1),
  (@IRM,@K_WAKTU,'IRM_02_KECEPATAN_ADM',N'Kecepatan pelayanan administrasi',@tplDropdown,0,1,1,2),
  (@IRM,@K_PTG,'IRM_03_KERAMAHAN',N'Keramahan petugas rehabilitasi',@tplDropdown,0,1,1,3),
  (@IRM,@K_PTG,'IRM_04_SKILL',N'Skill tenaga terapi',@tplDropdown,0,1,1,4),
  (@IRM,@K_INFO,'IRM_05_PENJELASAN',N'Penjelasan tindakan terapi mudah dipahami',@tplDropdown,0,1,1,5),
  (@IRM,@K_FAS,'IRM_06_KEBERSIHAN',N'Kebersihan ruang terapi',@tplDropdown,0,1,1,6),
  (@IRM,@K_FAS,'IRM_07_ALAT',N'Kelengkapan alat terapi',@tplDropdown,0,1,1,7),
  (@IRM,@K_FAS,'IRM_08_TUNGGU',N'Kenyamanan ruang tunggu',@tplDropdown,0,1,1,8),
  (@IRM,@K_PEL,'IRM_09_REKOMENDASI',N'Kesediaan merekomendasikan pelayanan ini',@tplDropdown,0,1,1,9),
  (@IRM,@K_PEL,'IRM_99_RATING',N'Penilaian Rating (Bintang) layanan IRM secara keseluruhan',@tplRate5,0,1,1,999);

  -- PATOLOGI KLINIK
  INSERT INTO @Q VALUES
  (@PATK,@K_PEL,'PATK_01_PENDAFTARAN',N'Kemudahan proses pendaftaran',@tplDropdown,0,1,1,1),
  (@PATK,@K_WAKTU,'PATK_02_KECEPATAN_ADM',N'Kecepatan pelayanan administrasi',@tplDropdown,0,1,1,2),
  (@PATK,@K_PTG,'PATK_03_KERAMAHAN',N'Keramahan dan sikap petugas',@tplDropdown,0,1,1,3),
  (@PATK,@K_PTG,'PATK_04_PROFESIONAL',N'Profesionalisme petugas',@tplDropdown,0,1,1,4),
  (@PATK,@K_INFO,'PATK_05_PROSEDUR',N'Kemampuan menjelaskan prosedur pengambilan sampel',@tplDropdown,0,1,1,5),
  (@PATK,@K_PEL,'PATK_06_RESPON',N'Respon terhadap pertanyaan / keluhan',@tplDropdown,0,1,1,6),
  (@PATK,@K_WAKTU,'PATK_07_WAKTU_SAMPEL',N'Ketepatan waktu pengambilan sampel',@tplDropdown,0,1,1,7),
  (@PATK,@K_INFO,'PATK_08_HASIL',N'Kejelasan hasil pemeriksaan',@tplDropdown,0,1,1,8),
  (@PATK,@K_PEL,'PATK_09_AKURASI',N'Kepercayaan terhadap keakuratan hasil',@tplDropdown,0,1,1,9),
  (@PATK,@K_PEL,'PATK_10_REKOMENDASI',N'Kesediaan merekomendasikan pelayanan ini',@tplDropdown,0,1,1,10),
  (@PATK,@K_PEL,'PATK_99_RATING',N'Penilaian Rating (Bintang) layanan Patologi Klinik secara keseluruhan',@tplRate5,0,1,1,999);

  -- PATOLOGI ANATOMI
  INSERT INTO @Q VALUES
  (@PATA,@K_PEL,'PATA_01_PENDAFTARAN',N'Kemudahan proses pendaftaran',@tplDropdown,0,1,1,1),
  (@PATA,@K_INFO,'PATA_02_INFO',N'Kejelasan informasi prosedur pemeriksaan',@tplDropdown,0,1,1,2),
  (@PATA,@K_WAKTU,'PATA_03_KECEPATAN',N'Kecepatan pelayanan administrasi',@tplDropdown,0,1,1,3),
  (@PATA,@K_PTG,'PATA_04_KERAMAHAN',N'Keramahan dan sikap petugas',@tplDropdown,0,1,1,4),
  (@PATA,@K_INFO,'PATA_05_PENJELASAN',N'Kemampuan menjelaskan prosedur',@tplDropdown,0,1,1,5),
  (@PATA,@K_PEL,'PATA_06_RESPON',N'Respons terhadap pertanyaan/keluhan',@tplDropdown,0,1,1,6),
  (@PATA,@K_FAS,'PATA_07_KEBERSIHAN',N'Kebersihan ruang pelayanan',@tplDropdown,0,1,1,7),
  (@PATA,@K_FAS,'PATA_08_TUNGGU',N'Kenyamanan ruang tunggu',@tplDropdown,0,1,1,8),
  (@PATA,@K_FAS,'PATA_09_FASILITAS',N'Kelengkapan fasilitas laboratorium',@tplDropdown,0,1,1,9),
  (@PATA,@K_PEL,'PATA_10_KEPUASAN',N'Kepuasan terhadap pelayanan secara keseluruhan',@tplDropdown,0,1,1,10),
  (@PATA,@K_PEL,'PATA_11_REKOMENDASI',N'Kesediaan merekomendasikan layanan ini',@tplDropdown,0,1,1,11),
  (@PATA,@K_PEL,'PATA_99_RATING',N'Penilaian Rating (Bintang) layanan Patologi Anatomi secara keseluruhan',@tplRate5,0,1,1,999);

  -- ADMISI
  INSERT INTO @Q VALUES
  (@ADM,@K_INFO,'ADM_01_INFO',N'Kejelasan informasi pelayanan',@tplDropdown,0,1,1,1),
  (@ADM,@K_WAKTU,'ADM_02_KECEPATAN',N'Kecepatan pelayanan administrasi',@tplDropdown,0,1,1,2),
  (@ADM,@K_PEL,'ADM_03_PENDAFTARAN',N'Kemudahan proses pendaftaran',@tplDropdown,0,1,1,3),
  (@ADM,@K_PTG,'ADM_04_KERAMAHAN',N'Keramahan dan sikap petugas',@tplDropdown,0,1,1,4),
  (@ADM,@K_INFO,'ADM_05_PENJELASAN',N'Kemampuan menjelaskan prosedur',@tplDropdown,0,1,1,5),
  (@ADM,@K_PEL,'ADM_06_RESPON',N'Respons terhadap pertanyaan/keluhan',@tplDropdown,0,1,1,6),
  (@ADM,@K_PEL,'ADM_99_RATING',N'Penilaian Rating (Bintang) layanan Administrasi secara keseluruhan',@tplRate5,0,1,1,999);

  MERGE m_pertanyaan AS T
  USING @Q AS S
  ON T.pertanyaan_code = S.pertanyaan_code
  WHEN MATCHED THEN
    UPDATE SET
      T.layanan_id = S.layanan_id,
      T.kategori_id = S.kategori_id,
      T.template_id = S.template_id,
      T.pertanyaan_text = S.pertanyaan_text,
      T.has_custom_opsi = S.has_custom_opsi,
      T.bobot = S.bobot,
      T.is_required = S.is_required,
      T.sort_order = S.sort_order,
      T.is_active = 1,
      T.updated_at = GETDATE()
  WHEN NOT MATCHED THEN
    INSERT (layanan_id,kategori_id,template_id,pertanyaan_code,pertanyaan_text,has_custom_opsi,bobot,is_required,allow_comment,sort_order,is_active,created_by)
    VALUES (S.layanan_id,S.kategori_id,S.template_id,S.pertanyaan_code,S.pertanyaan_text,S.has_custom_opsi,S.bobot,S.is_required,0,S.sort_order,1,'manual');

  PRINT '✅ Pertanyaan performa + rating bintang selesai';

  -- 5) Jenis Pelayanan Khusus

  -- IRM dropdown custom
  IF NOT EXISTS (SELECT 1 FROM m_pertanyaan WHERE pertanyaan_code='IRM_00_JENIS_PELAYANAN')
  BEGIN
    INSERT INTO m_pertanyaan (layanan_id,kategori_id,template_id,pertanyaan_code,pertanyaan_text,has_custom_opsi,bobot,is_required,sort_order,is_active,created_by)
    VALUES (@IRM,@K_INFO,@tplDropdown,'IRM_00_JENIS_PELAYANAN',N'Jenis Pelayanan IRM yang Anda terima',1,0,1,0,1,'manual');

    DECLARE @pidIRM INT = SCOPE_IDENTITY();
    INSERT INTO m_pertanyaan_opsi (pertanyaan_id,nilai,label,sort_order,is_active)
    VALUES
    (@pidIRM,1,'Okupasi Terapi',1,1),
    (@pidIRM,2,'Terapi Wicara',2,1);
  END
  ELSE
  BEGIN
    UPDATE m_pertanyaan
    SET template_id=@tplDropdown, has_custom_opsi=1, bobot=0, is_required=1, sort_order=0, is_active=1, updated_at=GETDATE()
    WHERE pertanyaan_code='IRM_00_JENIS_PELAYANAN';

    DECLARE @pidIRM2 INT = (SELECT pertanyaan_id FROM m_pertanyaan WHERE pertanyaan_code='IRM_00_JENIS_PELAYANAN');
    DELETE FROM m_pertanyaan_opsi WHERE pertanyaan_id=@pidIRM2;
    INSERT INTO m_pertanyaan_opsi (pertanyaan_id,nilai,label,sort_order,is_active)
    VALUES
    (@pidIRM2,1,'Okupasi Terapi',1,1),
    (@pidIRM2,2,'Terapi Wicara',2,1);
  END

  -- PATK free text
  IF NOT EXISTS (SELECT 1 FROM m_pertanyaan WHERE pertanyaan_code='PATK_00_JENIS_PELAYANAN')
  BEGIN
    INSERT INTO m_pertanyaan (layanan_id,kategori_id,template_id,pertanyaan_code,pertanyaan_text,placeholder_text,has_custom_opsi,bobot,is_required,sort_order,is_active,created_by)
    VALUES (
      @PATK,@K_INFO,@tplTextLong,
      'PATK_00_JENIS_PELAYANAN',
      N'Jenis Pelayanan/ Pemeriksaan yang Anda lakukan (tulis bebas)',
      N'Contoh: Hematologi rutin, Kimia darah, Imunologi, dll...',
      0,0,1,0,1,'manual'
    );
  END
  ELSE
  BEGIN
    UPDATE m_pertanyaan
    SET template_id=@tplTextLong, has_custom_opsi=0, bobot=0, is_required=1, sort_order=0, is_active=1, updated_at=GETDATE()
    WHERE pertanyaan_code='PATK_00_JENIS_PELAYANAN';
  END

  -- PATA dropdown custom
  IF NOT EXISTS (SELECT 1 FROM m_pertanyaan WHERE pertanyaan_code='PATA_00_JENIS_PELAYANAN')
  BEGIN
    INSERT INTO m_pertanyaan (layanan_id,kategori_id,template_id,pertanyaan_code,pertanyaan_text,has_custom_opsi,bobot,is_required,sort_order,is_active,created_by)
    VALUES (@PATA,@K_INFO,@tplDropdown,'PATA_00_JENIS_PELAYANAN',N'Jenis Pelayanan Patologi Anatomi yang Anda lakukan',1,0,1,0,1,'manual');

    DECLARE @pidPATA INT = SCOPE_IDENTITY();
    INSERT INTO m_pertanyaan_opsi (pertanyaan_id,nilai,label,sort_order,is_active)
    VALUES
    (@pidPATA,1,'Histopatologi',1,1),
    (@pidPATA,2,'Cytologi',2,1),
    (@pidPATA,3,'Pap Smear',3,1),
    (@pidPATA,4,'Tindakan FNAB',4,1),
    (@pidPATA,5,'Pengiriman Immunohistokimia',5,1);
  END
  ELSE
  BEGIN
    UPDATE m_pertanyaan
    SET template_id=@tplDropdown, has_custom_opsi=1, bobot=0, is_required=1, sort_order=0, is_active=1, updated_at=GETDATE()
    WHERE pertanyaan_code='PATA_00_JENIS_PELAYANAN';

    DECLARE @pidPATA2 INT = (SELECT pertanyaan_id FROM m_pertanyaan WHERE pertanyaan_code='PATA_00_JENIS_PELAYANAN');
    DELETE FROM m_pertanyaan_opsi WHERE pertanyaan_id=@pidPATA2;
    INSERT INTO m_pertanyaan_opsi (pertanyaan_id,nilai,label,sort_order,is_active)
    VALUES
    (@pidPATA2,1,'Histopatologi',1,1),
    (@pidPATA2,2,'Cytologi',2,1),
    (@pidPATA2,3,'Pap Smear',3,1),
    (@pidPATA2,4,'Tindakan FNAB',4,1),
    (@pidPATA2,5,'Pengiriman Immunohistokimia',5,1);
  END

  COMMIT;

  PRINT '✅ MASTER QUESTIONS FINALIZED SUCCESSFULLY';

END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK;

  DECLARE @msg NVARCHAR(4000) = ERROR_MESSAGE();
  PRINT '❌ ERROR: ' + @msg;
  THROW;
END CATCH;