import axios from "axios";

const clientId = "p31nvYJp-qebca_QX3lrjw";
const clientSecret = "K2EB0sspXU2ZJO9uTs4H9uamA7UtPg";
const username = "SportScore_io";
const password = "Aa1234567!@a";
const subreddit = "SportScore_io";

const postedMatches = new Set();
let matchIndex = 0;
let autopostData;

//Get autopost is on or off
async function fetchAutopost() {
  try {
    const response = await fetch('https://sportscore.io/api/v1/autopost/settings/reddit/', {
      method: 'GET',
      headers: {
        "accept": "application/json",
        'X-API-Key': 'uqzmebqojezbivd2dmpakmj93j7gjm',
      },
    });
    const data = await response.json();
    autopostData = data;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function fetchData() {
  try {
    const response = await fetch(
      "https://sportscore.io/api/v1/football/matches/?match_status=live&sort_by_time=false&page=0",
      {
        method: "GET",
        headers: {
          accept: "application/json",
          "X-API-Key": "uqzmebqojezbivd2dmpakmj93j7gjm",
        },
      }
    );

    const data = await response.json();
    processData(data.match_groups);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function processData(matchGroups) {
  try {
    if (!Array.isArray(matchGroups)) {
      console.error("Invalid matchGroups:", matchGroups);
      return;
    }

    await fetchAutopost();
    console.log(autopostData);
    
    if (autopostData[0].enabled) {
      matchGroups.forEach((matchGroup) => {
        getMatch(matchGroup);
      });
    }
  } catch (error) {
    console.error("Error processing data:", error);
  }
}

async function getMatch(matchGroup) {
  try {
    const competition = matchGroup.competition.name;

    matchGroup.matches.forEach((match) => {
      const matchId = match.id;

      if (!postedMatches.has(matchId)) {
        const homeTeam = match.home_team.name;
        const awayTeam = match.away_team.name;
        const league = competition;
        const matchLink = match.url;
        const hashtags = `#${homeTeam.replace(/\s+/g, '')} #${awayTeam.replace(/\s+/g, '')} #${league.replace(/\s+/g, '')}`;

        let postContent = `💥⚽️💥 ${homeTeam} vs ${awayTeam} League: ${league} 💥⚽️💥\n\n`;
        postContent += `Watch Now on SportScore: ${matchLink}\n\n`;

        const formattedHashtags = hashtags
          .split(' ')
          .map((tag) => `[${tag}](https://www.reddit.com/r/${subreddit}/search/?q=${encodeURIComponent(tag)}&restrict_sr=on&sort=new)`)
          .join(' ');

        postContent += `${formattedHashtags}\n\n`;
        
        // Introduce a delay of 1 minute before posting
        setTimeout(() => {
          postToReddit(postContent, matchLink);
        }, matchIndex * 60000);

        postedMatches.add(matchId);
        matchIndex++;
      }
    });
  } catch (error) {
    console.error("Error getting match:", error.message);
  }
}

async function postToReddit(postText, imageUrl) {
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
      kind: "link",
      text: postText,
      url: imageUrl,
      sr: subreddit,
    };

    await axios.post(`https://oauth.reddit.com/api/submit`, null, {
      params: postParams,
      headers: {
        Authorization: `bearer ${accessToken}`,
        "User-Agent": "SportScore-Poster/1.0",
      },
    });

    console.log("Post successful");
  } catch (error) {
    console.error("Error posting to Reddit:", error.response.data);
  }
}

setInterval(fetchData, 60000);

fetchData();
