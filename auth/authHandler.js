/**
 * Overwriting the standard auth function and letting the custom 
 * Passport strategy take the wheel
 * @param {Request} req 
 * @param {Response} res 
 * @param {function} next 
 */
module.exports = (req,res,next) => next()