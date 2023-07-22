"use client";
import { BigNumber, ethers } from "ethers";
import React, { createContext, useContext, useEffect, useState } from "react";
import { EthContext } from "./EthContext";

export const EventContext = createContext(null);

export const EventProvider = ({ children }) => {
  const [proposals, setProposals] = useState([]);
  const [votersAddress, setVotersAddress] = useState([]);
  const [votes, setVotes] = useState(new Map());
  const [currentWorkflowStatus, setCurrentWorkflowStatus] = useState();
  const [winningProposalId, setWinningProposalId] = useState(null);
  const {
    provider,
    account,
    doAppContractWithSigner,
    dataStoreContractWithSigner,
    doAppContract,
    dataStoreContract,
    setIsVoter,
    isVoter,
  } = useContext(EthContext);

  useEffect(() => {
    if (!account) return;
    const isVoter = votersAddress.find(
      (value) =>
        ethers.utils.getAddress(value) === ethers.utils.getAddress(account)
    );
    setIsVoter(!!isVoter);
  }, [votersAddress, account]);

  useEffect(() => {
    const proposalsFilter = doAppContract.filters.ProposalRegistered();
    const proposalsIds = doAppContract
      .queryFilter(proposalsFilter)
      .then((events) => {
        return events.map((event) => event.args.proposalId);
      });

    if (!!isVoter) {
      proposalsIds.then((ids) =>
        Promise.all(ids.map((id) => doAppContractWithSigner.getOneProposal(id)))
          .then((proposals) => {
            const proposalsWithId = proposals.map(
              (proposal, index) => ({
                proposalId: ids[index],
                proposalDescription: proposal.description,
                nbVote: proposal.voteCount,
              })
            );
            setProposals(proposalsWithId);
          })
          .catch((err) => console.log(err))
      );

      doAppContract.on("ProposalRegistered", (proposalId) => {
        doAppContractWithSigner.getOneProposal(proposalId).then((proposal) => {
          const newProposal = {
            proposalId,
            proposalDescription,
            nbVote,
          };
          setProposals((prevState) => {
            if (
              !!prevState.find(
                (proposal) =>
                  proposal.proposalId.toNumber() ===
                  newProposal.proposalId.toNumber()
              )
            ) {
              return prevState;
            } else {
              return [...prevState, newProposal];
            }
          });
        });
      });
    }

    return () => {
      doAppContract.removeAllListeners("ProposalRegistered");
    };
  }, [votersAddress, account, isVoter, votes]);

  useEffect(() => {
    const votersFilter = doAppContract.filters.VoterRegistered();
    doAppContract.queryFilter(votersFilter).then((events) => {
      setVotersAddress(events.map((event) => event.args.voterAddress));
    });

    doAppContract.on("VoterRegistered", (voterAddress) => {
      setVotersAddress((prevState) => {
        if (prevState.includes(voterAddress)) return prevState;
        return [...prevState, voterAddress];
      });
    });

    return () => {
      doAppContract.removeAllListeners("VoterRegistered");
    };
  }, []);

  useEffect(() => {
    const voteFilter = doAppContract.filters.Voted();

    doAppContract.queryFilter(voteFilter).then((events) => {
      events.forEach((event) => {
        const voter = event.args.voter;
        const proposalId = event.args.proposalId;

        setVotes((prevVotes) =>
          prevVotes.set(ethers.utils.getAddress(voter), proposalId)
        );
        console.log("new voter : ", voter, " - ", proposalId);
        console.log("votes : ", votes);
      });
    });

    doAppContract.on("Voted", (voter, proposalId) => {
      setVotes((prevVotes) =>
        new Map(prevVotes).set(ethers.utils.getAddress(voter), proposalId)
      );
      doAppContractWithSigner.winningProposalID().then((id) => {
        setWinningProposalId(id.toNumber());
      });
    });

    return () => {
      doAppContract.removeAllListeners("Voted");
    };
  }, []);

  useEffect(() => {
    doAppContractWithSigner
      .workflowStatus()
      .then((status) => setCurrentWorkflowStatus(status));

    doAppContract.on("WorkflowStatusChange", (_, newStatus) => {
      console.log("WorkflowStatusChange", newStatus);
      setCurrentWorkflowStatus(newStatus);
    });

    return () => {
      doAppContract.removeAllListeners("WorkflowStatusChange");
    };
  }, [account]);

  useEffect(() => {
    doAppContractWithSigner.winningProposalID().then((id) => {
      setWinningProposalId(id.toNumber());
    });

    doAppContract.on("WorkflowStatusChange", (_, newStatus) => {
      if (newStatus === 4) {
        doAppContractWithSigner.winningProposalID().then((id) => {
          setWinningProposalId(id.toNumber());
        });
      }
    });

    return () => {
      doAppContract.removeAllListeners("WorkflowStatusChange");
    };
  }, []);

  return (
    <EventContext.Provider
      value={{
        proposals,
        votes,
        currentWorkflowStatus,
        votersAddress,
        winningProposalId,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => useContext(EventContext);
