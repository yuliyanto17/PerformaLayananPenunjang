// src/store/usePenilaianStore.js

/**
 * ============================================
 * PENILAIAN STORE (Zustand)
 * ============================================
 * 
 * Global state management untuk flow penilaian
 * Menyimpan data yang persist sepanjang flow
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePenilaianStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // STATE
      // ============================================
      
      // Selected layanan
      selectedLayanan: null,
      
      // Selected pasien
      selectedPasien: null,
      
      // Validated petugas (from barcode scan)
      selectedPetugas: null,
      
      // Penilaian data
      penilaianId: null,
      penilaianNo: null,
      
      // Pertanyaan list
      pertanyaanList: [],
      
      // Answers (key: pertanyaan_id, value: answer data)
      answers: {},
      
      // Progress
      currentQuestionIndex: 0,
      progress: 0,
      
      // Session info
      sessionId: null,
      deviceInfo: null,
      
      // ============================================
      // ACTIONS
      // ============================================
      
      /**
       * Set selected layanan
       */
      setLayanan: (layanan) => {
        set({ selectedLayanan: layanan });
      },
      
      /**
       * Set selected pasien
       */
      setPasien: (pasien) => {
        set({ selectedPasien: pasien });
      },
      
      /**
       * Set selected petugas (from barcode)
       */
      setPetugas: (petugas) => {
        set({ selectedPetugas: petugas });
      },
      
      /**
       * Set penilaian data (after start)
       */
      setPenilaian: (penilaianId, penilaianNo) => {
        set({ penilaianId, penilaianNo });
      },
      
      /**
       * Set pertanyaan list
       */
      setPertanyaanList: (pertanyaanList) => {
        set({ pertanyaanList });
      },
      
      /**
       * Save answer
       */
      saveAnswer: (pertanyaanId, answerData) => {
        set((state) => {
            const nextAnswers = { ...state.answers, [pertanyaanId]: answerData };

            const isAnswered = (q, a) => {
            if (!q || !a) return false;

            switch (q.tipe_input) {
                case "dropdown":
                case "single_choice":
                return a.nilai_rating !== null && a.nilai_rating !== undefined && a.nilai_rating !== "";
                case "rating_5":
                return Number(a.nilai_rating) > 0;
                case "text_short":
                case "text_long":
                return (a.jawaban_text || "").trim().length > 0;
                case "boolean":
                return a.jawaban_boolean === true || a.jawaban_boolean === false;
                default:
                return true;
            }
            };

            const requiredQuestions = (state.pertanyaanList || []).filter((q) => q.is_required);
            const answeredRequired = requiredQuestions.filter((q) =>
            isAnswered(q, nextAnswers[q.pertanyaan_id])
            );

            const progress =
            requiredQuestions.length > 0
                ? (answeredRequired.length / requiredQuestions.length) * 100
                : 0;

            return { answers: nextAnswers, progress };
        });
        },
      
      /**
       * Recalculate progress from current pertanyaanList + answers.
       * Call this after pertanyaanList is (re)loaded so progress reflects existing answers.
       */
      recalculateProgress: () => {
        set((state) => {
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

          const requiredQuestions = (state.pertanyaanList || []).filter((q) => q.is_required);
          const answeredRequired = requiredQuestions.filter((q) =>
            isAnsweredFn(q, state.answers[q.pertanyaan_id])
          );

          const progress =
            requiredQuestions.length > 0
              ? (answeredRequired.length / requiredQuestions.length) * 100
              : 0;

          return { progress };
        });
      },

      /**
       * Go to next question
       */
      nextQuestion: () => {
        const { currentQuestionIndex, pertanyaanList } = get();
        if (currentQuestionIndex < pertanyaanList.length - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
      },
      
      /**
       * Go to previous question
       */
      previousQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },
      
      /**
       * Go to specific question
       */
      goToQuestion: (index) => {
        set({ currentQuestionIndex: index });
      },
      
      /**
       * Set session info
       */
      setSessionInfo: (sessionId, deviceInfo) => {
        set({ sessionId, deviceInfo });
      },
      
      /**
       * Check if all required questions answered
       */
      isAllRequiredAnswered: () => {
        const { pertanyaanList, answers } = get();

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

        const requiredQuestions = pertanyaanList.filter(q => q.is_required);
        const answeredRequired = requiredQuestions.filter(q =>
          isAnsweredFn(q, answers[q.pertanyaan_id])
        );

        return requiredQuestions.length === answeredRequired.length;
      },
      
      /**
       * Get current question
       */
      getCurrentQuestion: () => {
        const { pertanyaanList, currentQuestionIndex } = get();
        return pertanyaanList[currentQuestionIndex];
      },
      
      /**
       * Get answer for question
       */
      getAnswer: (pertanyaanId) => {
        const { answers } = get();
        return answers[pertanyaanId];
      },
      
      /**
       * Reset store (after submit or cancel)
       */
      reset: () => {
        set({
          selectedLayanan: null,
          selectedPasien: null,
          selectedPetugas: null,
          penilaianId: null,
          penilaianNo: null,
          pertanyaanList: [],
          answers: {},
          currentQuestionIndex: 0,
          progress: 0,
        });
      },
      
      /**
       * Get summary data
       */
      getSummary: () => {
        const state = get();
        return {
          layanan: state.selectedLayanan,
          pasien: state.selectedPasien,
          petugas: state.selectedPetugas,
          penilaianId: state.penilaianId,
          penilaianNo: state.penilaianNo,
          totalQuestions: state.pertanyaanList.length,
          answeredCount: Object.keys(state.answers).length,
          progress: state.progress,
          isComplete: state.isAllRequiredAnswered(),
        };
      },
    }),
    {
      name: 'penilaian-storage', // LocalStorage key
      partialize: (state) => ({
        // Only persist these fields
        selectedLayanan: state.selectedLayanan,
        selectedPasien: state.selectedPasien,
        selectedPetugas: state.selectedPetugas,
        penilaianId: state.penilaianId,
        penilaianNo: state.penilaianNo,
        answers: state.answers,
        sessionId: state.sessionId,
      }),
    }
  )
);

export default usePenilaianStore;