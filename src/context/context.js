import React, { useState, useContext, useEffect } from 'react';

import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState([]);
  const [repos, setRepos] = useState([]);
  const [followers, setFollowers] = useState([]);
  //requests and loading
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState(0);

  //errors
  const [error, setError] = useState({ show: false, msg: '' });
  //search user
  const searchGithubUser = async (user) => {
    setLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    if (response) {
      setGithubUser(response.data);
      const { login, followers_url } = response.data;
      toggleError(false, '');
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ]).then((results) => {
        const [repos, followers] = results;
        if (repos.status === 'fulfilled') {
          setRepos(repos.value.data);
        }
        if (followers.status === 'fulfilled') {
          setFollowers(followers.value.data);
        }
      });
    } else {
      toggleError(true, 'there is no user with that username');
    }
    checkRequest();
    setLoading(false);
  };

  useEffect(() => {
    searchGithubUser('shanto140319');
  }, []);

  const checkRequest = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;
        setRequests(remaining);
        if (remaining === 0) {
          toggleError(true, 'you have exceeded your hourly request limit!');
        }
      })
      .catch((err) => console.log(err));
  };

  //error funvtion
  function toggleError(show = false, msg = '') {
    setError({ show, msg });
  }

  useEffect(checkRequest, searchGithubUser, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        loading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export const useGlobalContext = () => {
  return useContext(GithubContext);
};

export { GithubContext, GithubProvider };
