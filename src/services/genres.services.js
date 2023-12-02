const { Op } = require('sequelize');
const db = require('../database/models')

const getAllGenres = async () => {
try {

    const genres = await db.Genre.findAll({
        order : [['name', 'ASC']]
    })
    
    return {
        genres
    }

} catch (error) {
    console.log(error);
    throw {
        status : 500,
        message : error.message
    }
}
}

module.exports = {
    getAllGenres
}