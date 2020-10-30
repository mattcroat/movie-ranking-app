import * as d3 from 'd3'
import { genres, months, desiredHeaders } from './lists'

// api key
const API_KEY = import.meta.env.SNOWPACK_PUBLIC_API_KEY

// helpers
const rangeOfYears = (start: number, end: number): number[] => {
  return Array(end - start + 1)
    .fill(start)
    .map((year: number, index: number) => year + index)
}

const asyncForEach = async (array: string[], callback: Function) => {
  for (let index = 0; index < array.length; index += 1) {
    await callback(array[index], index, array)
  }
}

const createLoadingAnimation = () => {
  const loadingAnimation = d3.create('div').attr('class', 'lds-ring')
  loadingAnimation.append('div')
  loadingAnimation.append('div')
  loadingAnimation.append('div')
  return loadingAnimation
}

const getAPIUrl = (year: number, genre: number, month: number) => {
  const apiUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}`
  const genres = `${genre ? `&with_genres=${genre}` : ''}`
  const region = `&region=US`
  const releaseType = '&with_release_type=3|2'
  const releaseDateGte = `&primary_release_date.gte=${year}-${('0' + (month + 1)).slice(-2)}-01`
  const releseDateLte = `&primary_release_date.lte=${year}-${('0' + (month + 1)).slice(-2)}-31`

  return `${apiUrl}${genres}${region}${releaseType}${releaseDateGte}${releseDateLte}`
}

// config
const minYear = 1950
const maxYear = new Date().getFullYear()

// create DOM elements
const mainContainer = d3
  .select('body')
  .append('div')
  .attr('id', 'mainContainer')
  .attr('class', 'container')

mainContainer.append('h1').attr('id', 'top').text('New Releases')

const optionsDiv = mainContainer.append('div').attr('id', 'options')
const yearDiv = optionsDiv.append('div').attr('id', 'year')
const genreDiv = optionsDiv.append('div').attr('id', 'genre')
const monthsDiv = mainContainer.append('div').attr('id', 'months')
const movieDataDiv = mainContainer.append('div').attr('id', 'movieData')

// create year select list
yearDiv.append('label').attr('class', 'select-label').text('Year:')

const yearSelect = yearDiv
  .append('select')
  .attr('id', 'yearSelect')
  .on('change', () => {
    const currentGenre = +(document.getElementById('genreSelect') as HTMLInputElement).value
    const currentYear = +(document.getElementById('yearSelect') as HTMLInputElement).value
    getMovieDataForYear(currentYear, currentGenre)
  })

yearSelect
  .selectAll('option')
  .data(rangeOfYears(minYear, maxYear).reverse())
  .enter()
  .append('option')
  .text(year => year)

// create genre select list
genreDiv.append('label').attr('class', 'select-label').text('Genre:')

const genreSelect = genreDiv
  .append('select')
  .attr('id', 'genreSelect')
  .on('change', () => {
    const currentGenre = +(document.getElementById('genreSelect') as HTMLInputElement).value
    const currentYear = +(document.getElementById('yearSelect') as HTMLInputElement).value
    getMovieDataForYear(currentYear, currentGenre)
  })

genreSelect
  .selectAll('option')
  .data(genres)
  .enter()
  .append('option')
  .text(genre => genre.name)
  .attr('value', genre => genre.id)

// logic
const getMovieDataForYear = async (year: number, genre: number) => {
  // clear
  monthsDiv.html('')
  movieDataDiv.html('')

  // create month links
  monthsDiv
    .selectAll('div')
    .data(months)
    .enter()
    .append('a')
    .attr('class', 'month-name')
    .attr('href', month => `#${month}-${year}`)
    .text(month => month)

  // get data for each month
  await asyncForEach(months, async (month: string, index: number) => {
    const movieDataElement = movieDataDiv.append('div')

    try {
      movieDataElement.append(() => createLoadingAnimation().node())
      const url = getAPIUrl(year, genre, index)
      const movieData = await d3.json(url)
    } catch (error) {
      console.error(error)
      movieDataElement.selectAll('.lds-ring').remove()
      movieDataDiv
        .append('h2')
        .text(`Error retrieveing data for ${month}-${year}`)
    }
  })
}

getMovieDataForYear(2020, genres[11].id!)
