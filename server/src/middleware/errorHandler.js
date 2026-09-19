export function errorHandler(err, req, res, next) {
  console.error('API Error:', err);

  let statusCode = err.status || err.statusCode || 500;
  let userMessage = 'Something went wrong while explaining this document. Please try again.';

  if (err.status === 401 || err.message?.includes('API key')) {
    statusCode = 401;
    userMessage = 'The AI service key is missing or invalid. Please check the backend configuration.';
  } else if (err.status === 429) {
    statusCode = 429;
    userMessage = 'The AI service is experiencing high traffic. Please wait a moment and try again.';
  } else if (err.status === 413 || err.type === 'entity.too.large') {
    statusCode = 413;
    userMessage = 'The document photo is too large. Please upload an image under 8MB.';
  } else if (err.message?.includes('network') || err.code === 'ENOTFOUND') {
    statusCode = 503;
    userMessage = 'Unable to reach the AI service. Please check your internet connection.';
  }

  res.status(statusCode).json({
    success: false,
    code: err.code || 'INTERNAL_ERROR',
    message: userMessage
  });
}
