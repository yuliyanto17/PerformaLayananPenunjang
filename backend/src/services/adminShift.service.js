const db = require("../config/database");
const ApiError = require("../utils/ApiError");

class AdminShiftService {
  async applyShift({ layanan_id, shift_date, shift_name, petugas_ids, assigned_by }) {
    const ids = Array.isArray(petugas_ids) ? petugas_ids : [];
    const idsJson = JSON.stringify(ids);

    // Only sync is_on_duty on m_petugas when applying TODAY's shift.
    // Applying a past/future shift should only update the historical shift records,
    // not overwrite the current realtime on-duty status.
    const todayStr = new Date().toISOString().split('T')[0];
    const shiftDateStr = new Date(shift_date).toISOString().split('T')[0];
    const isToday = shiftDateStr === todayStr;

    return db.executeTransaction(async (trx) => {
      // 1) Validasi petugas_ids: harus milik layanan admin & aktif
      const invalid = await trx.request()
        .input("layanan_id", db.sql.Int, layanan_id)
        .input("idsJson", db.sql.NVarChar, idsJson)
        .query(`
          SELECT CAST(j.[value] as INT) as petugas_id
          FROM OPENJSON(@idsJson) j
          LEFT JOIN m_petugas p
            ON p.petugas_id = CAST(j.[value] as INT)
           AND p.layanan_id = @layanan_id
           AND p.is_active = 1
          WHERE p.petugas_id IS NULL
        `);

      if (invalid.recordset.length > 0) {
        throw new ApiError(400, "Ada petugas_id tidak valid untuk layanan ini", {
          invalid_petugas_ids: invalid.recordset.map(r => r.petugas_id),
        });
      }

      // 2) Upsert shift header (layanan+tanggal+shift)
      const shiftRes = await trx.request()
        .input("layanan_id", db.sql.Int, layanan_id)
        .input("shift_date", db.sql.Date, shift_date)
        .input("shift_name", db.sql.VarChar, shift_name)
        .query(`
          SELECT TOP 1 shift_id
          FROM t_shift_header
          WHERE layanan_id = @layanan_id
            AND shift_date = @shift_date
            AND shift_name = @shift_name
            AND is_active = 1
        `);

      let shift_id = shiftRes.recordset[0]?.shift_id;

      if (!shift_id) {
        const ins = await trx.request()
          .input("layanan_id", db.sql.Int, layanan_id)
          .input("shift_date", db.sql.Date, shift_date)
          .input("shift_name", db.sql.VarChar, shift_name)
          .input("created_by", db.sql.VarChar, assigned_by || "admin")
          .query(`
            INSERT INTO t_shift_header (layanan_id, shift_date, shift_name, created_by)
            OUTPUT INSERTED.shift_id
            VALUES (@layanan_id, @shift_date, @shift_name, @created_by)
          `);

        shift_id = ins.recordset[0].shift_id;
      }

      // 3) Replace shift petugas list
      await trx.request()
        .input("shift_id", db.sql.Int, shift_id)
        .query(`DELETE FROM t_shift_petugas WHERE shift_id = @shift_id`);

      if (ids.length > 0) {
        await trx.request()
          .input("shift_id", db.sql.Int, shift_id)
          .input("idsJson", db.sql.NVarChar, idsJson)
          .input("assigned_by", db.sql.VarChar, assigned_by || "admin")
          .query(`
            INSERT INTO t_shift_petugas (shift_id, petugas_id, on_duty, assigned_by)
            SELECT 
              @shift_id,
              CAST([value] as INT) as petugas_id,
              1,
              @assigned_by
            FROM OPENJSON(@idsJson)
          `);
      }

      // 4 & 5) Only update realtime is_on_duty when this shift is for today.
      // For past/future shifts, only the historical shift records are updated above.
      if (isToday) {
        // 4) SET OFF DUTY for all petugas in this layanan
        await trx.request()
          .input("layanan_id", db.sql.Int, layanan_id)
          .input("shift_name", db.sql.VarChar, shift_name)
          .query(`
            UPDATE m_petugas
            SET
              is_on_duty = 0,
              shift_current = @shift_name,
              updated_at = GETDATE()
            WHERE layanan_id = @layanan_id
              AND is_active = 1
          `);

        // 5) SET ON DUTY for selected petugas
        if (ids.length > 0) {
          await trx.request()
            .input("layanan_id", db.sql.Int, layanan_id)
            .input("shift_name", db.sql.VarChar, shift_name)
            .input("idsJson", db.sql.NVarChar, idsJson)
            .query(`
              UPDATE m_petugas
              SET
                is_on_duty = 1,
                shift_current = @shift_name,
                updated_at = GETDATE()
              WHERE layanan_id = @layanan_id
                AND petugas_id IN (SELECT CAST([value] as INT) FROM OPENJSON(@idsJson))
            `);
        }
      }

      // 6) Return status shift terbaru
      const onDutyRes = await trx.request()
        .input("layanan_id", db.sql.Int, layanan_id)
        .query(`
          SELECT 
            p.petugas_id, p.nip, p.nama_petugas, p.jabatan,
            p.layanan_id, l.layanan_name, l.layanan_code,
            p.is_on_duty, p.shift_current, p.barcode_token
          FROM m_petugas p
          INNER JOIN m_layanan_penunjang l ON p.layanan_id = l.layanan_id
          WHERE p.layanan_id = @layanan_id
            AND p.is_active = 1
            AND p.is_on_duty = 1
          ORDER BY p.nama_petugas
        `);

      return {
        shift: { shift_id, layanan_id, shift_date, shift_name },
        on_duty_petugas: onDutyRes.recordset,
        selected_petugas_ids: ids,
      };
    });
  }

  async getShiftStatus({ layanan_id, shift_date, shift_name }) {
    const shiftRes = await db.executeLocalQuery(
      `
      SELECT TOP 1 shift_id, layanan_id, shift_date, shift_name, created_at, created_by
      FROM t_shift_header
      WHERE layanan_id = @layanan_id
        AND shift_date = @shift_date
        AND shift_name = @shift_name
        AND is_active = 1
      ORDER BY created_at DESC
    `,
      { layanan_id, shift_date, shift_name }
    );

    const shift = shiftRes.recordset[0];
    if (!shift) {
      return {
        shift: null,
        on_duty_petugas: [],
        selected_petugas_ids: [],
      };
    }

    const detailRes = await db.executeLocalQuery(
      `
      SELECT 
        p.petugas_id, p.nip, p.nama_petugas, p.jabatan,
        p.barcode_token, p.is_on_duty
      FROM t_shift_petugas sp
      INNER JOIN m_petugas p ON sp.petugas_id = p.petugas_id
      WHERE sp.shift_id = @shift_id
        AND sp.on_duty = 1
      ORDER BY p.nama_petugas
    `,
      { shift_id: shift.shift_id }
    );

    return {
      shift,
      on_duty_petugas: detailRes.recordset,
      selected_petugas_ids: detailRes.recordset.map(r => r.petugas_id),
    };
  }

  async endAllShifts(adminLayananId) {
    try {
            const result = await db.executeLocalQuery(
            `
            UPDATE m_petugas
            SET is_on_duty = 0, updated_at = GETDATE()
            WHERE layanan_id = @layanan_id AND is_on_duty = 1 AND is_active = 1
            `,
            { layanan_id: adminLayananId }
            );
            return true;
        } catch (err) {
            throw new ApiError(500, "Gagal menyelesaikan semua shift", err.message);
        }
    }
}

module.exports = new AdminShiftService();