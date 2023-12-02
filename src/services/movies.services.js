const { Op } = require('sequelize');
const db = require('../database/models')


const getAllMovies = async (limit, offset, keyword) => {

    const options = keyword ? {
        where : {
            title : {
                [Op.substring] : keyword
            }
        }
    } : null

try {

    const movies = await db.Movie.findAll({
        limit,
        offset,
        attributes : {
            exclude : ['created_at', 'updated_at', 'genre_id']
        },
        include : [
            {
                association : 'genre',
                attributes : ['id', 'name']
            },
            {
                association : 'actors',
                attributes : ['id', 'first_name', 'last_name'],
                through : {
                    attributes : []
                }
            }
        ],
         ...options
    });
    const count = await db.Movie.count({
        ...options
    })
    
    return {
        movies,
        count
    }

} catch (error) {
    console.log(error);
    throw {
        status : 500,
        message : error.message
    }
}
}

const getMovieById = async (id) => {
    try {
        if (!id) {
            throw {
                status : 400,
                message : 'ID no existe'
            }
        }

        const movie = await db.Movie.findByPk(id,{
            attributes : {
                exclude : ['created_at', 'updated_at', 'genre_id']
            },
            include : [
                {
                    association : 'genre',
                    attributes : ['id', 'name']
                },
                {
                    association : 'actors',
                    attributes : ['id', 'first_name', 'last_name'],
                    through : {
                        attributes : []
                    }
                }
            ]
        });
            if (!movie) {
                throw {
                    status : 400,
                    message : 'No hay pelicula con este ID'
                }
            }
        return movie
    
    } catch (error) {
        console.log(error);
        throw {
            status : error.status || 500,
            message : error.message || 'ERROR Servicio'
        }
    }
}

const storeMovie = async (dataMovie, actors) => {
    try {
        const newMovie = await db.Movie.create(dataMovie)
        if (actors) {
            const actorsDB = actors.map(actor => {
                return {
                  movie_id : newMovie.id,
                  actor_id : actor
                }
              })
             await db.Actor_Movie.bulkCreate(actorsDB,{
                validate : true
              })
        }

        return await getMovieById(newMovie.id)

    } catch (error) {
        console.log(error);
        throw {
            status : error.status || 500,
            message : error.message || 'ERROR Servicio'
        }
    }
}

const updateMovie = async (id, dataMovie) => {
    try {
        const {title, awards, rating, length, release_date, genre_id, actors} = dataMovie

        const movie = await db.Movie.findByPk(id,{
            attributes : {
                exclude : ['created_at', 'updated_at', 'genre_id']
            },
            include : [
                {
                    association : 'genre',
                    attributes : ['id', 'name']
                },
                {
                    association : 'actors',
                    attributes : ['id', 'first_name', 'last_name'],
                    through : {
                        attributes : []
                    }
                }
            ]
        })

        if (!movie) {
            throw {
                status : 400,
                message : 'No hay pelicula con este ID'
            }
        }

        movie.title = title?.trim() || movie.title
        movie.awards = awards || movie.awards
        movie.rating = rating || movie.rating
        movie.length = length || movie.length
        movie.release_date = release_date || movie.release_date
        movie.genre_id = genre_id || movie.genre_id

        await movie.save()

        if (actors?.length) {
            await db.Actor_Movie.destroy({
                where : {
                    movie_id : id
                }
            })

            const actorsArray = actors.map(actor => {
                return {
                    movie_id : id,
                    actor_id : actor
                }
            })

            await db.Actor_Movie.bulkCreate(actorsArray,{
                validate : true
            })
        }

        await movie.reload()

        return movie
        
    } catch (error) {
        console.log(error);
        throw {
            status : error.status || 500,
            message : error.message || 'ERROR Servicio'
        }
    }
};

const deleteMovie = async (id) => {
    try {
        if (isNaN(id)) {
            throw {
                status : 400,
                message : 'No es un ID'
            }
        }

        const movie = await db.Movie.findByPk(id)

        if (!movie) {
            throw {
                status : 400,
                message : 'No hay pelicula con este ID'
            }
        }

        await db.Actor_Movie.destroy({
            where : {
                movie_id : id
            }
        })

        await db.Actor.update({
            favorite_movie_id : null
        },
        {
            where : {
                favorite_movie_id : id
            }
        })

        await movie.destroy()

        return null

    } catch (error) {
        console.log(error);
        throw {
            status : error.status || 500,
            message : error.message || 'ERROR Servicio'
        }
    }
}

module.exports = {
    getAllMovies,
    getMovieById,
    storeMovie,
    updateMovie,
    deleteMovie
}