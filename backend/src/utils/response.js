// src/utils/response.js

/**
 * ============================================
 * RESPONSE FORMATTER UTILITY
 * ============================================
 * 
 * Standardize format response API
 * Konsisten di semua endpoints
 */

/**
 * Success Response
 * 
 * @param {object} res - Express response object
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * 
 * Format:
 * {
 *   success: true,
 *   message: "...",
 *   data: {...},
 *   statusCode: 200
 * }
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    statusCode,
  });
};

/**
 * Success Response with Pagination
 * 
 * @param {object} res - Express response object
 * @param {array} data - Array of data
 * @param {object} pagination - Pagination info
 * @param {string} message - Success message
 * 
 * Format:
 * {
 *   success: true,
 *   message: "...",
 *   data: [...],
 *   pagination: {
 *     page: 1,
 *     limit: 20,
 *     total: 100,
 *     totalPages: 5
 *   },
 *   statusCode: 200
 * }
 */
const successResponseWithPagination = (
  res,
  data,
  pagination,
  message = 'Success'
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
    statusCode: 200,
  });
};

/**
 * Created Response (201)
 * 
 * Untuk response setelah create data baru
 */
const createdResponse = (res, data, message = 'Data created successfully') => {
  return successResponse(res, data, message, 201);
};

/**
 * No Content Response (204)
 * 
 * Untuk response tanpa body (biasanya untuk DELETE)
 */
const noContentResponse = (res) => {
  return res.status(204).send();
};

/**
 * Error Response
 * 
 * Sebenarnya error di-handle oleh errorHandler middleware,
 * tapi ini untuk manual error response jika diperlukan
 */
const errorResponse = (
  res,
  message = 'Internal Server Error',
  statusCode = 500,
  errors = null
) => {
  const response = {
    success: false,
    message,
    statusCode,
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  successResponseWithPagination,
  createdResponse,
  noContentResponse,
  errorResponse,
};