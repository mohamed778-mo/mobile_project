const setLanguage = (req, res, next) => {
    req.language = req.headers['Accept-Language'] || 'en';
    next();
  };
  
  module.exports = {setLanguage};
  
