import axios from "axios";

const clientId = "LLLaFpRNu8BqnFUVDPsvmw";
const clientSecret = "PYx5Pchx8cpOci-7UwKBerz47yNE4A";
const username = "SportScoreio";
const password = "Aa1234567!@a";
const subreddit = "SportScoreIO";

const postedMatches = new Set();

function fetchData() {
  fetch(
    "https://sportscore.io/api/v1/football/matches/?match_status=live&sort_by_time=false&page=0",
    {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-Key": "uqzmebqojezbivd2dmpakmj93j7gjm",
      },
    }
  )
    .then((response) => response.json())
    .then((data) => {
      processData(data.match_groups);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function processData(matchGroups) {
  try {
    if (!Array.isArray(matchGroups)) {
      console.error("Invalid matchGroups:", matchGroups);
      return;
    }

    matchGroups.forEach((matchGroup) => {
      getMatch(matchGroup);
    });
  } catch (error) {
    console.error("Error processing data:", error);
  }
}

async function getMatch(matchGroup) {
  try {
      const competition = matchGroup.competition.name;

      matchGroup.matches.forEach(match => {
          const matchId = match.id;

          if (!postedMatches.has(matchId)) {
              const homeTeam = match.home_team.name;
              const awayTeam = match.away_team.name;
              const league = competition;
              const matchLink = match.url;
              const venueName = match.venue ? match.venue.name : '';

              let postContent = `🎌 Match Started! 🎌\n\n`;
              postContent += `💥⚽️💥 ${homeTeam} vs ${awayTeam} League: ${league} 💥⚽️💥\n\n`;
              postContent += `Watch Now on SportScore: ${matchLink}\n\n`;
              postContent += `Venue: ${venueName}\n\n`;

              postToReddit(postContent);

              postedMatches.add(matchId);
          }
      });
  } catch (error) {
      console.error('Error getting match:', error.message);
  }
}

async function postToReddit(postText) {
  try {
    const authResponse = await axios.post(
      "https://www.reddit.com/api/v1/access_token",
      null,
      {
        params: {
          grant_type: "password",
          username: username,
          password: password,
        },
        auth: {
          username: clientId,
          password: clientSecret,
        },
      }
    );

    const accessToken = authResponse.data.access_token;

    const postParams = {
      title: "Match started!",
      kind: "self",
      text: postText,
      sr: subreddit,
    };

    await axios.post(`https://oauth.reddit.com/api/submit`, null, {
      params: postParams,
      headers: {
        Authorization: `bearer ${accessToken}`,
        "User-Agent": "SportScoreIO/1.0",
      },
    });

    console.log("Post successful");
  } catch (error) {
    console.error("Error posting to Reddit:", error.response.data);
  }
}

setInterval(fetchData, 60000);

fetchData();
