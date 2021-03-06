package edu.mit.cci.pogs.model.dao.export;

import java.sql.Timestamp;

public class CompletedTaskScoreSubjectTeamExport {

    private String studyPrefix;
    private String sessionSuffix;
    private Timestamp sessionStartDate;
    private Long sessionId;
    private String taskName;
    private Boolean soloTask;
    private String soloSubject;
    private String teamSubjects;
    private Double totalScore;
    private Integer numberOfEntries;
    private Integer numberOfProcessedEntries;
    private Integer numberOfRightAnswers;
    private Integer numberOfWrongAnswers;

    public CompletedTaskScoreSubjectTeamExport() {
    }

    public CompletedTaskScoreSubjectTeamExport(String studyPrefix, String sessionSuffix,
                                               Timestamp sessionStartDate,
                                               Long sessionId,
                                               String taskName, Boolean soloTask, Double totalScore, Integer numberOfEntries, Integer numberOfProcessedEntries, Integer numberOfRightAnswers, Integer numberOfWrongAnswers) {
        this.studyPrefix = studyPrefix;
        this.sessionSuffix = sessionSuffix;
        this.sessionStartDate = sessionStartDate;
        this.sessionId = sessionId;
        this.taskName = taskName;
        this.soloTask = soloTask;
        this.totalScore = totalScore;
        this.numberOfEntries = numberOfEntries;
        this.numberOfProcessedEntries = numberOfProcessedEntries;
        this.numberOfRightAnswers = numberOfRightAnswers;
        this.numberOfWrongAnswers = numberOfWrongAnswers;
    }

    public String getStudyPrefix() {
        return studyPrefix;
    }

    public void setStudyPrefix(String studyPrefix) {
        this.studyPrefix = studyPrefix;
    }

    public String getSessionSuffix() {
        return sessionSuffix;
    }

    public void setSessionSuffix(String sessionSuffix) {
        this.sessionSuffix = sessionSuffix;
    }

    public String getTaskName() {
        return taskName;
    }

    public void setTaskName(String taskName) {
        this.taskName = taskName;
    }

    public Boolean getSoloTask() {
        return soloTask;
    }

    public void setSoloTask(Boolean soloTask) {
        this.soloTask = soloTask;
    }

    public String getSoloSubject() {
        return soloSubject;
    }

    public void setSoloSubject(String soloSubject) {
        this.soloSubject = soloSubject;
    }

    public String getTeamSubjects() {
        return teamSubjects;
    }

    public void setTeamSubjects(String teamSubjects) {
        this.teamSubjects = teamSubjects;
    }

    public Double getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(Double totalScore) {
        this.totalScore = totalScore;
    }

    public Integer getNumberOfEntries() {
        return numberOfEntries;
    }

    public void setNumberOfEntries(Integer numberOfEntries) {
        this.numberOfEntries = numberOfEntries;
    }

    public Integer getNumberOfProcessedEntries() {
        return numberOfProcessedEntries;
    }

    public void setNumberOfProcessedEntries(Integer numberOfProcessedEntries) {
        this.numberOfProcessedEntries = numberOfProcessedEntries;
    }

    public Integer getNumberOfRightAnswers() {
        return numberOfRightAnswers;
    }

    public void setNumberOfRightAnswers(Integer numberOfRightAnswers) {
        this.numberOfRightAnswers = numberOfRightAnswers;
    }

    public Integer getNumberOfWrongAnswers() {
        return numberOfWrongAnswers;
    }

    public void setNumberOfWrongAnswers(Integer numberOfWrongAnswers) {
        this.numberOfWrongAnswers = numberOfWrongAnswers;
    }

    public Timestamp getSessionStartDate() {
        return sessionStartDate;
    }

    public void setSessionStartDate(Timestamp sessionStartDate) {
        this.sessionStartDate = sessionStartDate;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }
}
