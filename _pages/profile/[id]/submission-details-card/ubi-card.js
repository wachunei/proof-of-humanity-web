import { Button, Card, Text, useContract, useWeb3 } from "@kleros/components";
import { UBI } from "@kleros/icons";
import { useEffect, useMemo, useReducer } from "react";

function AccruedUBI({ lastMintedSecond, web3, accruedPerSecond }) {
  const [, rerender] = useReducer(() => ({}), {});
  useEffect(() => {
    const timeout = setInterval(() => rerender(), 1000);
    return () => clearInterval(timeout);
  }, []);

  let accruedUBI;
  if (lastMintedSecond)
    if (lastMintedSecond.eq(web3.utils.toBN(0))) accruedUBI = lastMintedSecond;
    else if (accruedPerSecond)
      accruedUBI = web3.utils
        .toBN(Math.floor(Date.now() / 1000))
        .sub(lastMintedSecond)
        .mul(accruedPerSecond);

  return <Text>{accruedUBI && `${web3.utils.fromWei(accruedUBI)} UBI`}</Text>;
}
export default function UBICard({ submissionID }) {
  const { web3 } = useWeb3();
  const [accounts] = useWeb3("eth", "getAccounts");

  const [lastMintedSecond, , status, reCall] = useContract(
    "UBI",
    "accruedSince",
    useMemo(() => ({ args: [submissionID] }), [submissionID])
  );
  const [registered] = useContract(
    "proofOfHumanity",
    "isRegistered",
    useMemo(() => ({ args: [submissionID] }), [submissionID])
  );
  const [accruedPerSecond] = useContract("UBI", "accruedPerSecond");

  let method;
  let text;
  if (lastMintedSecond && typeof registered === "boolean")
    if (lastMintedSecond.eq(web3.utils.toBN(0))) {
      if (registered) {
        method = "startAccruing";
        text = "Start Accruing";
      }
    } else if (!registered) {
      method = "reportRemoval";
      text = "Seize UBI";
    }

  const { send, loading } = useContract("UBI", method);
  return (
    <Card
      variant="muted"
      mainSx={{ justifyContent: "space-between", padding: 1 }}
    >
      <UBI size={32} />
      <AccruedUBI
        lastMintedSecond={lastMintedSecond}
        web3={web3}
        accruedPerSecond={accruedPerSecond}
      />
      {text &&
        accounts &&
        accounts[0] &&
        accounts[0].toLowerCase() === submissionID && (
          <Button
            variant="secondary"
            disabled={status === "pending"}
            onClick={() => send(submissionID).then(reCall)}
            loading={loading}
          >
            {text}
          </Button>
        )}
    </Card>
  );
}
