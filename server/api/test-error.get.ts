export default defineEventHandler((event) => {
  const type = getQuery(event).type as string | undefined
  if (type === '404') {
    // Throw 404 error
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'Test 404 error' })
  }
  if (type === '500') {
    // Throw generic error
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: 'Test 500 error' })
  }
  // Default response
  return { message: 'Specify ?type=404 or ?type=500' }
})
