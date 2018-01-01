const constants = require('../constants');

/**
 * 400 Response.
 *
 * @param res
 * @param errors
 */
const resError400 = (res, errors) => {
  console.error(errors);

  let lclErrors;
  if (Array.isArray(errors)) lclErrors = errors;
  else lclErrors = [{ message: errors }];

  return res.json({ status: constants.status400, data: null, errors: lclErrors })
};

/**
 * 500 Response.
 *
 * @param res
 * @param error
 */
const resError500 = (res, error) => {
  console.error(error.message);
  return resError400(res, constants.errors.INTERNAL_SERVER_ERROR);
};

/**
 * 200 Response
 *
 * @param res
 * @param data
 */
const resSuccess200 = (res, data) => res.json({ status: constants.status200, data });


module.exports = {
  resError400,
  resError500,
  resSuccess200
};