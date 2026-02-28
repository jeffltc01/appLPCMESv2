import { Body1, Body1Strong, Caption1, Divider, Link, makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import type { HelpTopic } from "../../types/help";

const useStyles = makeStyles({
  root: {
    display: "grid",
    gap: "8px",
  },
  title: {
    color: "#123046",
    fontSize: "16px",
  },
  purpose: {
    borderLeft: "3px solid #017CC5",
    paddingLeft: "10px",
  },
  section: {
    display: "grid",
    gap: tokens.spacingVerticalS,
    marginTop: "4px",
    paddingTop: "8px",
    borderTop: "1px solid #e8e8e8",
  },
  list: {
    margin: 0,
    paddingLeft: "20px",
    display: "grid",
    gap: tokens.spacingVerticalXS,
  },
  muted: {
    color: tokens.colorNeutralForeground2,
  },
});

interface HelpTopicViewProps {
  topic: HelpTopic;
}

export function HelpTopicView({ topic }: HelpTopicViewProps) {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <Body1Strong className={styles.title}>{topic.title}</Body1Strong>
      <Body1 className={mergeClasses(styles.muted, styles.purpose)}>{topic.purpose}</Body1>

      <div className={styles.section}>
        <Body1Strong>When to use</Body1Strong>
        <ul className={styles.list}>
          {topic.whenToUse.map((entry) => (
            <li key={entry}>
              <Body1>{entry}</Body1>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.section}>
        <Body1Strong>Prerequisites</Body1Strong>
        <ul className={styles.list}>
          {topic.prerequisites.map((entry) => (
            <li key={entry}>
              <Body1>{entry}</Body1>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.section}>
        <Body1Strong>Step-by-step actions</Body1Strong>
        <ol className={styles.list}>
          {topic.stepByStepActions.map((entry) => (
            <li key={entry}>
              <Body1>{entry}</Body1>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.section}>
        <Body1Strong>Expected result</Body1Strong>
        <Body1>{topic.expectedResult}</Body1>
      </div>

      <div className={styles.section}>
        <Body1Strong>Common errors and recovery</Body1Strong>
        {topic.commonErrorsAndRecovery.map((item) => (
          <div key={item.error}>
            <Body1Strong>{item.error}</Body1Strong>
            {item.cause ? <Body1 className={styles.muted}>Cause: {item.cause}</Body1> : null}
            <ul className={styles.list}>
              {item.recovery.map((step) => (
                <li key={step}>
                  <Body1>{step}</Body1>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {topic.externalReferenceLinks?.length ? (
        <div className={styles.section}>
          <Body1Strong>External references</Body1Strong>
          <ul className={styles.list}>
            {topic.externalReferenceLinks.map((href) => (
              <li key={href}>
                <Link href={href} target="_blank" rel="noreferrer">
                  {href}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {topic.knownLimitations?.length ? (
        <div className={styles.section}>
          <Body1Strong>Known limitations</Body1Strong>
          <ul className={styles.list}>
            {topic.knownLimitations.map((entry) => (
              <li key={entry}>
                <Body1>{entry}</Body1>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Divider />
      <Caption1 className={styles.muted}>
        Last validated: {new Date(topic.lastValidatedOnUtc).toLocaleDateString()} by {topic.validatedBy}
      </Caption1>
    </div>
  );
}
