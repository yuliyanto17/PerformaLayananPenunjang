// src/pages/penilaian/FormPenilaianPage.jsx

/**
 * ============================================
 * FORM PENILAIAN PAGE
 * ============================================
 * 
 * Halaman form penilaian (most complex page!)
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ProgressBar from '../../components/common/ProgressBar';
import Loading from '../../components/common/Loading';
import RatingInput from '../../components/forms/RatingInput';
import SelectInput from '../../components/forms/SelectInput';
import TextArea from '../../components/forms/TextArea';
import { useApi } from '../../hooks/useApi';
import { useTimer } from '../../hooks/useTimer';
import { useDeviceInfo } from '../../hooks/useDeviceInfo';
import { pertanyaanApi } from '../../api/pertanyaan.api';
import { penilaianApi } from '../../api/penilaian.api';
import { usePenilaianStore } from '../../store/usePenilaianStore';
import { ROUTES, RATING_EMOJI, RATING_LABEL, RATING_COLORS } from '../../utils/constants';
import StarRatingInput from '../../components/forms/StarRatingInput';
import ConfirmSubmitModal from '../../components/common/ConfirmSubmitModal';
import toast from 'react-hot-toast';

const FormPenilaianPage = () => {
  const navigate = useNavigate();
  const deviceInfo = useDeviceInfo();
  const timer = useTimer();

  const {
    selectedLayanan,
    selectedPasien,
    selectedPetugas,
    penilaianId,
    pertanyaanList,
    currentQuestionIndex,
    answers,
    setPenilaian,
    setPertanyaanList,
    saveAnswer,
    getAnswer,
    getCurrentQuestion,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    isAllRequiredAnswered,
    sessionId,
  } = usePenilaianStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [komentarTambahan, setKomentarTambahan] = useState('');
  const initializingRef = useRef(false);

  const { execute: loadPertanyaan } = useApi(pertanyaanApi.getByLayanan);

  const pageSize = 3;
  const [pageIndex, setPageIndex] = useState(0);
  const [showFinalRating, setShowFinalRating] = useState(false);

  const [manualToken, setManualToken] = useState("");
  const scrollContainerRef = useRef(null);

  // Scroll ke atas saat ganti halaman pertanyaan
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pageIndex, showFinalRating]);

  // Redirect if no data
  useEffect(() => {
    if (!selectedLayanan || !selectedPasien || !selectedPetugas) {
      navigate(ROUTES.SELECT_LAYANAN);
      return;
    }

    initializePenilaian();
  }, []);

  // Load current answer when question changes
  useEffect(() => {
    const currentQuestion = getCurrentQuestion();
    if (currentQuestion) {
      const savedAnswer = getAnswer(currentQuestion.pertanyaan_id);
      setCurrentAnswer(savedAnswer || null);
      setKomentarTambahan(savedAnswer?.komentar || '');

      // Reset and start timer for this question
      timer.reset();
      timer.start();
    }
  }, [currentQuestionIndex]);

  const ratingQuestion = useMemo(() => {
    return pertanyaanList.find((q) => (q.pertanyaan_code || "").endsWith("_99_RATING"));
  }, [pertanyaanList]);

  const mainQuestions = useMemo(() => {
    const list = pertanyaanList
      .filter((q) => q.pertanyaan_id !== ratingQuestion?.pertanyaan_id)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return list;
  }, [pertanyaanList, ratingQuestion]);

  const totalPages = Math.ceil(mainQuestions.length / pageSize);

  const pageQuestions = useMemo(() => {
    return mainQuestions.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);
  }, [mainQuestions, pageIndex]);

  const isFirstPage = pageIndex === 0 && !showFinalRating;
  const isLastMainPage = pageIndex === totalPages - 1;

  // Derive progress directly from answers + pertanyaanList so it is always in sync,
  // even when answers are hydrated from localStorage after the store initializes.
  const progress = useMemo(() => {
    const isAnsweredFn = (q, a) => {
      if (!q || !a) return false;
      switch (q.tipe_input) {
        case 'dropdown':
        case 'single_choice':
          return a.nilai_rating !== null && a.nilai_rating !== undefined && a.nilai_rating !== '';
        case 'rating_5':
        case 'rating_emoji':
        case 'rating_10':
          return Number(a.nilai_rating) > 0;
        case 'text_short':
        case 'text_long':
          return (a.jawaban_text || '').trim().length > 0;
        case 'boolean':
          return a.jawaban_boolean === true || a.jawaban_boolean === false;
        default:
          return true;
      }
    };

    const required = pertanyaanList.filter((q) => q.is_required);
    if (required.length === 0) return 0;
    const answered = required.filter((q) => isAnsweredFn(q, answers[q.pertanyaan_id]));
    return (answered.length / required.length) * 100;
  }, [pertanyaanList, answers]);

  const initializePenilaian = async () => {
    // Guard against double-call from React Strict Mode or concurrent renders
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      setLoading(true);

      // Always reload pertanyaan for the active layanan.
      // Skipping when length > 0 is unsafe: Zustand keeps state in memory across navigations,
      // so stale questions from a previous layanan/session would remain and break validation.
      const response = await loadPertanyaan(selectedLayanan.layanan_id);
      setPertanyaanList(response.data);
      // Progress is now a derived useMemo — no manual recalculation needed.

      // Start penilaian if not started
      if (!penilaianId) {
        const startResponse = await penilaianApi.start({
          no_reg: selectedPasien.No_Reg,
          no_mr: selectedPasien.No_MR,
          nama_pasien: selectedPasien.Nama_Pasien,
          tgl_masuk: selectedPasien.Tgl_Masuk,
          medis: selectedPasien.Medis,
          jenis_kelamin: selectedPasien.Jenis_Kelamin,
          nama_rekanan: selectedPasien.NamaRekanan,
          layanan_id: selectedLayanan.layanan_id,
          petugas_id: selectedPetugas.petugas_id,
          session_id: sessionId,
          ...deviceInfo,
        });

        setPenilaian(
          startResponse.data.penilaian_id,
          startResponse.data.penilaian_no
        );
      }

    } catch (error) {
      console.error('Error initializing:', error);
      toast.error('Gagal memuat form penilaian');
      initializingRef.current = false; // allow retry on error
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = async (value) => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    const durasi = timer.getTime();

    let answerData = {
      pertanyaan_id: currentQuestion.pertanyaan_id,
      urutan_jawab: currentQuestionIndex + 1,
      durasi_jawab: durasi,
    };


    switch (currentQuestion.tipe_input) {
      /**
       * STAR RATING (1..5)
       */
      case "rating_5":
      case "rating_emoji":
      case "rating_10": {
        const v = Number(value) || 0;
        answerData.nilai_rating = v;
        // optional (biar readable di export)
        answerData.jawaban_pilihan = currentQuestion.tipe_input === "rating_5" ? `${v} Bintang` : null;
        break;
      }

      /**
       * TEXT
       */
      case "text_short":
      case "text_long": {
        answerData.jawaban_text = value ?? "";
        break;
      }

      /**
       * BOOLEAN
       */
      case "boolean": {
        answerData.jawaban_boolean = Boolean(value);
        break;
      }

      /**
       * DROPDOWN (4 level) / single choice
       *
       * Kita butuh:
       * - nilai_rating = angka (1..4) untuk scoring, tapi hanya jika bobot > 0
       * - jawaban_pilihan = label yang dipilih
       *
       * value bisa datang dalam beberapa bentuk:
       * - { nilai, label } (yang paling ideal)
       * - "4" (dari <select>)
       * - 4 (number)
       */
      case "dropdown":
      case "single_choice":
      case "multiple_choice": {
        let selectedNilai = null;
        let selectedLabel = "";

        // jika value berupa object: { nilai, label }
        if (value && typeof value === "object") {
          selectedNilai = value.nilai !== undefined ? Number(value.nilai) : null;
          selectedLabel = value.label || "";
        } else {
          // value string/number: anggap itu NILAI
          selectedNilai = value !== "" && value !== null && value !== undefined ? Number(value) : null;
          if (selectedNilai !== null && Array.isArray(currentQuestion.opsi_jawaban)) {
            selectedLabel =
              currentQuestion.opsi_jawaban.find((o) => Number(o.nilai) === selectedNilai)?.label || "";
          }
        }

        // simpan label yang dipilih
        answerData.jawaban_pilihan = selectedLabel;

        // hanya masuk scoring jika bobot > 0
        answerData.nilai_rating = currentQuestion.bobot > 0 ? selectedNilai : null;

        break;
      }

      default:
        break;
    }

    // komentar tambahan (optional)
    if (komentarTambahan && komentarTambahan.trim().length > 0) {
      answerData.komentar = komentarTambahan.trim();
    }

    setCurrentAnswer(answerData);

    // Save to store
    saveAnswer(currentQuestion.pertanyaan_id, answerData);

    // Auto-save to API
    if (penilaianId) {
      penilaianApi.saveAnswer(penilaianId, answerData).catch((err) => {
        console.error("Auto-save error:", err);
      });
    }
  };

  // Variant of handleAnswerChange that accepts an explicit question (used in page-based layout
  // where multiple questions are visible at once, so getCurrentQuestion() would be wrong).
  const handleAnswerChangeForQuestion = (question, value) => {
    if (!question) return;

    const durasi = timer.getTime();

    let answerData = {
      pertanyaan_id: question.pertanyaan_id,
      urutan_jawab: pertanyaanList.findIndex((q) => q.pertanyaan_id === question.pertanyaan_id) + 1,
      durasi_jawab: durasi,
    };

    switch (question.tipe_input) {
      case "rating_5":
      case "rating_emoji":
      case "rating_10": {
        const v = Number(value) || 0;
        answerData.nilai_rating = v;
        answerData.jawaban_pilihan = question.tipe_input === "rating_5" ? `${v} Bintang` : null;
        break;
      }
      case "text_short":
      case "text_long": {
        answerData.jawaban_text = value ?? "";
        break;
      }
      case "boolean": {
        answerData.jawaban_boolean = Boolean(value);
        break;
      }
      case "dropdown":
      case "single_choice":
      case "multiple_choice": {
        let selectedNilai = null;
        let selectedLabel = "";

        if (value && typeof value === "object") {
          selectedNilai = value.nilai !== undefined ? Number(value.nilai) : null;
          selectedLabel = value.label || "";
        } else {
          selectedNilai = value !== "" && value !== null && value !== undefined ? Number(value) : null;
          if (selectedNilai !== null && Array.isArray(question.opsi_jawaban)) {
            selectedLabel = question.opsi_jawaban.find((o) => Number(o.nilai) === selectedNilai)?.label || "";
          }
        }

        answerData.jawaban_pilihan = selectedLabel;
        // Always store nilai_rating so isAnswered() can detect the answer for progress tracking.
        // bobot=0 only means the question doesn't affect scoring, not that it has no value.
        answerData.nilai_rating = selectedNilai;
        break;
      }
      default:
        break;
    }

    saveAnswer(question.pertanyaan_id, answerData);

    if (penilaianId) {
      penilaianApi.saveAnswer(penilaianId, answerData).catch((err) => {
        console.error("Auto-save error:", err);
      });
    }
  };

  const isAnswered = (q) => {
    const a = getAnswer(q.pertanyaan_id);
    if (!a) return false;

    switch (q.tipe_input) {
      case "dropdown":
      case "single_choice":
        return a.nilai_rating !== null && a.nilai_rating !== undefined && a.nilai_rating !== "";
      case "rating_5":
        return Number(a.nilai_rating) > 0;
      case "text_long":
      case "text_short":
        return (a.jawaban_text || "").trim().length > 0;
      default:
        return true;
    }
  };

  const isQuestionAnswered = (question, answer) => {
    if (!question) return false;
    if (!answer) return false;

    switch (question.tipe_input) {
      case "dropdown":
      case "single_choice":
        return answer.nilai_rating !== null && answer.nilai_rating !== undefined && answer.nilai_rating !== "";
      case "rating_5":
      case "rating_10":
      case "rating_emoji":
        return Number(answer.nilai_rating) > 0;
      case "text_short":
      case "text_long":
        return (answer.jawaban_text || "").trim().length > 0;
      case "boolean":
        return answer.jawaban_boolean === true || answer.jawaban_boolean === false;
      default:
        return true;
    }
  };

  const handleNext = () => {
    // Validate required questions on current page using store answers (not local state)
    const unanswered = pageQuestions.filter((q) => q.is_required && !isAnswered(q));
    if (unanswered.length > 0) {
      toast.error("Masih ada pertanyaan wajib yang belum diisi");
      return;
    }

    if (isLastMainPage) {
      setShowFinalRating(true);
    } else {
      setPageIndex((p) => p + 1);
    }
  };

  const handlePrevious = () => {
    if (showFinalRating) {
      setShowFinalRating(false);
      return;
    }
    if (pageIndex > 0) setPageIndex((p) => p - 1);
  };

  // Step 1: validate, then open confirmation modal
  const handleSubmit = () => {
    if (!isAllRequiredAnswered()) {
      toast.error('Masih ada pertanyaan wajib yang belum dijawab');
      return;
    }
    setShowConfirmModal(true);
  };

  // Step 2: called when user confirms inside the modal
  const handleConfirmSubmit = async () => {
    try {
      setSubmitting(true);

      await penilaianApi.submit(penilaianId, {
        komentar_umum: '',
        saran: '',
      });

      toast.success('Penilaian berhasil dikirim!');
      setShowConfirmModal(false);
      navigate(ROUTES.THANK_YOU);

    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Gagal mengirim penilaian');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Loading fullScreen text="Memuat form penilaian..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      header={{
        title: showFinalRating
          ? 'Rating Keseluruhan'
          : `Halaman ${pageIndex + 1} dari ${totalPages}`,
        subtitle: selectedLayanan?.layanan_name,
        showHome: true,
      }}
    >
      {/* Progress Bar */}
      <div className="mb-6">
        <ProgressBar progress={progress} />
      </div>

      {/* QUESTIONS (3 cards per page) */}
      {!showFinalRating ? (
        <div ref={scrollContainerRef} className="space-y-4 max-h-[70vh] overflow-auto pr-2 pb-4 scroll-smooth">
          {pageQuestions.map((q) => {
            const ans = getAnswer(q.pertanyaan_id);

            return (
              <Card key={q.pertanyaan_id}>
                {/* Badge kategori */}
                <div className="mb-3">
                  <span className="badge badge-primary">{q.kategori_name}</span>
                </div>

                {/* Teks pertanyaan */}
                <h2 className="text-lg md:text-xl font-bold text-gray-900">
                  {q.pertanyaan_text}
                  {q.is_required && <span className="text-red-500 ml-1">*</span>}
                </h2>

                {q.pertanyaan_subtitle && (
                  <p className="text-gray-600 mt-1">{q.pertanyaan_subtitle}</p>
                )}

                {/* INPUT */}
                <div className="mt-5">
                  {(q.tipe_input === "dropdown" || q.tipe_input === "single_choice") && (
                    <SelectInput
                      value={ans?.nilai_rating ?? ""} // ✅ numeric 1..4
                      placeholder="Pilih jawaban..."
                      options={(q.opsi_jawaban || []).map((o) => ({
                        value: o.nilai, // ✅ numeric
                        label: o.label,
                      }))}
                      onChange={(e) => {
                        const nilai = e.target.value === "" ? null : Number(e.target.value);
                        const label =
                          q.opsi_jawaban?.find((o) => Number(o.nilai) === nilai)?.label || "";
                        handleAnswerChangeForQuestion(q, { nilai, label });
                      }}
                    />
                  )}

                  {(q.tipe_input === "text_long" || q.tipe_input === "text_short") && (
                    <TextArea
                      value={ans?.jawaban_text || ""}
                      onChange={(e) => handleAnswerChangeForQuestion(q, e.target.value)}
                      placeholder={q.placeholder_text || "Tuliskan jawaban Anda..."}
                      rows={q.tipe_input === "text_long" ? 6 : 3}
                      maxLength={q.tipe_input === "text_long" ? 1000 : 200}
                      showCount
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* FINAL PAGE: rating global 1 card */
        <Card>
          <div className="mb-3">
            <span className="badge badge-primary">Rating Global</span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {ratingQuestion?.pertanyaan_text || "Penilaian Rating (Bintang) Secara Keseluruhan"}
            <span className="text-red-500 ml-1">*</span>
          </h2>

          <p className="text-gray-600 mt-2">
            Berikan penilaian bintang untuk pelayanan secara keseluruhan.
          </p>

          <div className="mt-8">
            <StarRatingInput
              value={getAnswer(ratingQuestion?.pertanyaan_id)?.nilai_rating || 0}
              onChange={(v) => handleAnswerChangeForQuestion(ratingQuestion, v)}
            />
          </div>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="mt-6 flex gap-3">
        <Button
          onClick={handlePrevious}
          variant="secondary"
          icon={ChevronLeft}
          disabled={isFirstPage}
          className="flex-1"
        >
          Sebelumnya
        </Button>

        {!showFinalRating ? (
          <Button
            onClick={handleNext}
            variant="primary"
            icon={ChevronRight}
            iconPosition="right"
            className="flex-1"
          >
            Selanjutnya
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="success"
            icon={Send}
            iconPosition="right"
            loading={submitting}
            className="flex-1"
          >
            Kirim Penilaian
          </Button>
        )}
      </div>

      {/* Question Navigation */}
      <div className="mt-6">
        <Card className="bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Navigasi Pertanyaan
          </p>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
            {mainQuestions.map((q, index) => {
              const answered = isAnswered(q);
              const pageOfQuestion = Math.floor(index / pageSize);
              const isOnCurrentPage = !showFinalRating && pageOfQuestion === pageIndex;

              return (
                <button
                  key={q.pertanyaan_id}
                  onClick={() => setPageIndex(pageOfQuestion)}
                  className={`
                    w-10 h-10 rounded-lg font-semibold text-sm transition-all
                    ${isOnCurrentPage ? 'bg-primary-600 text-white ring-2 ring-primary-300' : ''}
                    ${!isOnCurrentPage && answered ? 'bg-green-100 text-green-700' : ''}
                    ${!isOnCurrentPage && !answered ? 'bg-gray-200 text-gray-600' : ''}
                    hover:scale-105
                  `}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Confirm Submit Modal */}
      <ConfirmSubmitModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        submitting={submitting}
        layanan={selectedLayanan}
        pasien={selectedPasien}
        petugas={selectedPetugas}
        totalPertanyaan={pertanyaanList.length}
        totalTerjawab={Object.keys(answers).length}
        progress={progress}
      />
    </MainLayout>
  );
};

export default FormPenilaianPage;