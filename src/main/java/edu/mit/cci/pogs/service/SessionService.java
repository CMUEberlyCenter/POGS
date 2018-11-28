package edu.mit.cci.pogs.service;

import edu.mit.cci.pogs.model.dao.completedtask.CompletedTaskDao;
import edu.mit.cci.pogs.model.dao.completedtaskattribute.CompletedTaskAttributeDao;
import edu.mit.cci.pogs.model.dao.completedtaskscore.CompletedTaskScoreDao;
import edu.mit.cci.pogs.model.dao.eventlog.EventLogDao;
import edu.mit.cci.pogs.model.dao.round.RoundDao;
import edu.mit.cci.pogs.model.dao.session.SessionDao;
import edu.mit.cci.pogs.model.dao.session.SessionScheduleType;
import edu.mit.cci.pogs.model.dao.session.SessionStatus;
import edu.mit.cci.pogs.model.dao.sessionhastaskgroup.SessionHasTaskGroupDao;
import edu.mit.cci.pogs.model.dao.subject.SubjectDao;
import edu.mit.cci.pogs.model.dao.subjectattribute.SubjectAttributeDao;
import edu.mit.cci.pogs.model.dao.team.TeamDao;
import edu.mit.cci.pogs.model.dao.teamhassubject.TeamHasSubjectDao;
import edu.mit.cci.pogs.model.jooq.tables.pojos.*;
import edu.mit.cci.pogs.runner.SessionRunner;
import edu.mit.cci.pogs.runner.SessionRunnerManager;
import edu.mit.cci.pogs.view.session.beans.SessionBean;
import edu.mit.cci.pogs.view.session.beans.SubjectBean;
import edu.mit.cci.pogs.view.session.beans.SubjectsBean;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class SessionService {


    private final SessionHasTaskGroupDao sessionHasTaskGroupDao;
    private final SessionDao sessionDao;
    private final SubjectDao subjectDao;
    private final CompletedTaskAttributeDao completedTaskAttributeDao;
    private final CompletedTaskDao completedTaskDao;
    private final TeamHasSubjectDao teamHasSubjectDao;
    private final TeamDao teamDao;
    private final RoundDao roundDao;
    private final EventLogDao eventLogDao;
    private final SubjectCommunicationService subjectCommunicationService;
    private final SubjectAttributeDao subjectAttributeDao;
    private final CompletedTaskScoreDao completedTaskScoreDao;

    private final TodoEntryService todoEntryService;

    private final VotingService votingService;

    private static final Logger _log = LoggerFactory.getLogger(SessionService.class);

    public static final long WAITING_ROOM_OPEN_INIT_WINDOW = 15 * 60_000;//15 mins

    @Autowired
    private ApplicationContext context;


    @Autowired
    public SessionService(SessionHasTaskGroupDao sessionHasTaskGroupDao, SessionDao sessionDao,
                          SubjectDao subjectdao,
                          CompletedTaskDao completedTaskDao,
                          CompletedTaskAttributeDao completedTaskAttributeDao,
                          TeamHasSubjectDao teamHasSubjectDao,
                          TeamDao teamDao,
                          RoundDao roundDao,
                          EventLogDao eventLogDao,
                          SubjectCommunicationService subjectCommunicationService,
                          SubjectAttributeDao subjectAttributeDao,
                          TodoEntryService todoEntryService,
                          VotingService votingService,
                          CompletedTaskScoreDao completedTaskScoreDao
    ) {
        this.todoEntryService = todoEntryService;
        this.votingService = votingService;
        this.sessionHasTaskGroupDao = sessionHasTaskGroupDao;
        this.sessionDao = sessionDao;
        this.subjectDao = subjectdao;
        this.completedTaskAttributeDao = completedTaskAttributeDao;
        this.completedTaskDao = completedTaskDao;
        this.teamHasSubjectDao = teamHasSubjectDao;
        this.teamDao = teamDao;
        this.roundDao = roundDao;
        this.eventLogDao = eventLogDao;
        this.subjectCommunicationService = subjectCommunicationService;
        this.subjectAttributeDao = subjectAttributeDao;
        this.completedTaskScoreDao = completedTaskScoreDao;
    }

    public List<SessionHasTaskGroup> listSessionHasTaskGroupBySessionId(Long sessionid) {
        return sessionHasTaskGroupDao.listSessionHasTaskGroupBySessionId(sessionid);
    }

    public void initializeSessionRunners() {
        List<Session> sessions = getSessionsToBeInitialized();
        initiateThreadsForSessions(sessions);

    }

    public Session getPerpetualSessionForSubject(String externalId) {
        List<Session> sessions = sessionDao.listPerpetualCurrentlyAccpeting(WAITING_ROOM_OPEN_INIT_WINDOW);
        for (Session s : sessions) {
            if (externalId.startsWith(s.getPerpetualSubjectsPrefix())) {

                return s;
            }
        }
        return null;
    }

    public void initializePerpetualSessionRunners() {
        List<Session> sessions = sessionDao.listPerpetualCurrentlyAccpeting(WAITING_ROOM_OPEN_INIT_WINDOW);
        initiateThreadsForSessions(sessions);
    }

    private void initiateThreadsForSessions(List<Session> sessions) {
        for (Session s : sessions) {

            if (SessionRunnerManager.getSessionRunner(s.getId()) == null) {
                _log.debug(" Session runner starting: PREFIX(" + s.getSessionSuffix()+") - ID(" + s.getId() + ")");
                SessionRunner sessionRunner = (SessionRunner) context.getBean("sessionRunner");
                sessionRunner.setSession(s);
                SessionRunnerManager.addSessionRunner(s.getId(), sessionRunner);
                Thread thread = new Thread(sessionRunner);
                thread.start();
            }

        }
    }

    public List<Session> getSessionsToBeInitialized() {
        return sessionDao.listStartsIn(WAITING_ROOM_OPEN_INIT_WINDOW);
    }


    public Session createOrUpdate(SessionBean sessionBean) {
        Session session = new Session();
        session.setId(sessionBean.getId());
        session.setSessionSuffix(sessionBean.getSessionSuffix());
        session.setSessionStartDate(sessionBean.getSessionStartDate());
        session.setStudyId(sessionBean.getStudyId());
        session.setStatus(sessionBean.getStatus());
        session.setWaitingRoomTime(sessionBean.getWaitingRoomTime());
        session.setIntroPageEnabled(sessionBean.getIntroPageEnabled());
        session.setIntroText(sessionBean.getIntroText());
        session.setIntroTime(sessionBean.getIntroTime());
        session.setDisplayNameChangePageEnabled(sessionBean.getDisplayNameChangePageEnabled());
        session.setDisplayNameChangeTime(sessionBean.getDisplayNameChangeTime());
        session.setRosterPageEnabled(sessionBean.getRosterPageEnabled());
        session.setRosterTime(sessionBean.getRosterTime());
        session.setDonePageEnabled(sessionBean.getDonePageEnabled());
        session.setDonePageText(sessionBean.getDonePageText());
        session.setDonePageTime(sessionBean.getDonePageTime());
        session.setDoneRedirectUrl(sessionBean.getDoneRedirectUrl());
        session.setCouldNotAssignToTeamMessage(sessionBean.getCouldNotAssignToTeamMessage());
        session.setTaskExecutionType(sessionBean.getTaskExecutionType());
        session.setRoundsEnabled(sessionBean.getRoundsEnabled());
        session.setNumberOfRounds(sessionBean.getNumberOfRounds());
        session.setCommunicationType(sessionBean.getCommunicationType());
        session.setChatBotName(sessionBean.getChatBotName());
        session.setScoreboardEnabled(sessionBean.getScoreboardEnabled());
        session.setScoreboardDisplayType(sessionBean.getScoreboardDisplayType());
        session.setScoreboardUseDisplayNames(sessionBean.getScoreboardUseDisplayNames());
        session.setCollaborationTodoListEnabled(sessionBean.getCollaborationTodoListEnabled());
        session.setCollaborationFeedbackWidgetEnabled(sessionBean.getCollaborationFeedbackWidgetEnabled());
        session.setCollaborationVotingWidgetEnabled(sessionBean.getCollaborationVotingWidgetEnabled());
        session.setTeamCreationMoment(sessionBean.getTeamCreationMoment());
        session.setTeamCreationType(sessionBean.getTeamCreationType());
        session.setTeamMinSize(sessionBean.getTeamMinSize());
        session.setTeamMaxSize(sessionBean.getTeamMaxSize());
        session.setTeamCreationMethod(sessionBean.getTeamCreationMethod());
        session.setTeamCreationMatrix(sessionBean.getTeamCreationMatrix());
        session.setFixedInteractionTime(sessionBean.getFixedInteractionTime());

        session.setSessionScheduleType(sessionBean.getSessionScheduleType());
        session.setPerpetualStartDate(sessionBean.getPerpetualStartDate());
        session.setPerpetualEndDate(sessionBean.getPerpetualEndDate());
        session.setPerpetualSubjectsNumber(sessionBean.getPerpetualSubjectsNumber());
        session.setPerpetualSubjectsPrefix(sessionBean.getPerpetualSubjectsPrefix());

        if (session.getRosterTime() == null) {
            session.setRosterTime(0);
        }
        if (session.getIntroTime() == null) {
            session.setIntroTime(0);
        }
        if (session.getDonePageTime() == null) {
            session.setDonePageTime(0);
        }
        if (session.getWaitingRoomTime() == null) {
            session.setWaitingRoomTime(0);
        }
        if (session.getFixedInteractionTime() == null) {
            session.setFixedInteractionTime(0);
        }
        if (session.getDisplayNameChangeTime() == null) {
            session.setDisplayNameChangeTime(0);
        }

        if (sessionBean.getId() == null) {
            session = sessionDao.create(session);
            sessionBean.setId(session.getId());
            createOrUpdateSessionHasTaskGroups(sessionBean);
        } else {
            sessionDao.update(session);
            createOrUpdateSessionHasTaskGroups(sessionBean);
            SessionRunnerManager.removeSessionRunner(session.getId());
        }

        return session;
    }

    public Session clonePerpetualSession(Session session) {
        Session clonedNonPerpetualSession = new Session();


        clonedNonPerpetualSession.setSessionSuffix(session.getSessionSuffix());
        clonedNonPerpetualSession.setSessionStartDate(new Timestamp(new Date().getTime() + 1000 * 60 * 1));
        clonedNonPerpetualSession.setStatus(SessionStatus.NOTSTARTED.getId().toString());
        clonedNonPerpetualSession.setWaitingRoomTime(session.getWaitingRoomTime());
        clonedNonPerpetualSession.setIntroPageEnabled(session.getIntroPageEnabled());
        clonedNonPerpetualSession.setIntroText(session.getIntroText());
        clonedNonPerpetualSession.setIntroTime(session.getIntroTime());
        clonedNonPerpetualSession.setDisplayNameChangePageEnabled(session.getDisplayNameChangePageEnabled());
        clonedNonPerpetualSession.setDisplayNameChangeTime(session.getDisplayNameChangeTime());
        clonedNonPerpetualSession.setRosterPageEnabled(session.getRosterPageEnabled());
        clonedNonPerpetualSession.setRosterTime(session.getRosterTime());
        clonedNonPerpetualSession.setDonePageEnabled(session.getDonePageEnabled());
        clonedNonPerpetualSession.setDonePageText(session.getDonePageText());
        clonedNonPerpetualSession.setDonePageTime(session.getDonePageTime());
        clonedNonPerpetualSession.setDoneRedirectUrl(session.getDoneRedirectUrl());
        clonedNonPerpetualSession.setCouldNotAssignToTeamMessage(session.getCouldNotAssignToTeamMessage());
        clonedNonPerpetualSession.setTaskExecutionType(session.getTaskExecutionType());
        clonedNonPerpetualSession.setRoundsEnabled(session.getRoundsEnabled());
        clonedNonPerpetualSession.setNumberOfRounds(session.getNumberOfRounds());
        clonedNonPerpetualSession.setCommunicationType(session.getCommunicationType());
        clonedNonPerpetualSession.setChatBotName(session.getChatBotName());
        clonedNonPerpetualSession.setScoreboardEnabled(session.getScoreboardEnabled());
        clonedNonPerpetualSession.setScoreboardDisplayType(session.getScoreboardDisplayType());
        clonedNonPerpetualSession.setScoreboardUseDisplayNames(session.getScoreboardUseDisplayNames());
        clonedNonPerpetualSession.setCollaborationTodoListEnabled(session.getCollaborationTodoListEnabled());
        clonedNonPerpetualSession.setCollaborationFeedbackWidgetEnabled(session.getCollaborationFeedbackWidgetEnabled());
        clonedNonPerpetualSession.setCollaborationVotingWidgetEnabled(session.getCollaborationVotingWidgetEnabled());
        clonedNonPerpetualSession.setTeamCreationMoment(session.getTeamCreationMoment());
        clonedNonPerpetualSession.setTeamCreationType(session.getTeamCreationType());
        clonedNonPerpetualSession.setTeamMinSize(session.getTeamMinSize());
        clonedNonPerpetualSession.setTeamMaxSize(session.getTeamMaxSize());
        clonedNonPerpetualSession.setTeamCreationMethod(session.getTeamCreationMethod());
        clonedNonPerpetualSession.setTeamCreationMatrix(session.getTeamCreationMatrix());
        clonedNonPerpetualSession.setFixedInteractionTime(session.getFixedInteractionTime());
        clonedNonPerpetualSession.setStudyId(session.getStudyId());
        clonedNonPerpetualSession.setSessionScheduleType(SessionScheduleType.SCHEDULED_DATE.getId().toString());
        clonedNonPerpetualSession = sessionDao.create(clonedNonPerpetualSession);
        List<SessionHasTaskGroup> taskGroup = sessionHasTaskGroupDao.listSessionHasTaskGroupBySessionId(session.getId());

        for (SessionHasTaskGroup shtg : taskGroup) {
            SessionHasTaskGroup newShtg = new SessionHasTaskGroup();
            newShtg.setSessionId(clonedNonPerpetualSession.getId());
            newShtg.setTaskGroupId(shtg.getTaskGroupId());
            sessionHasTaskGroupDao.create(newShtg);
        }

        return clonedNonPerpetualSession;
    }

    private void createOrUpdateSessionHasTaskGroups(SessionBean studyBean) {
        if (studyBean.getSessionHasTaskGroupRelationshipBean() == null && studyBean.getSessionHasTaskGroupRelationshipBean().getSelectedValues() == null) {
            return;
        }
        List<SessionHasTaskGroup> toCreate = new ArrayList<>();
        List<SessionHasTaskGroup> toDelete = new ArrayList<>();
        List<SessionHasTaskGroup> currentlySelected = listSessionHasTaskGroupBySessionId(studyBean.getId());

        for (SessionHasTaskGroup rghau : currentlySelected) {
            boolean foundRGH = false;
            for (String researchGroupId : studyBean.getSessionHasTaskGroupRelationshipBean().getSelectedValues()) {
                if (rghau.getTaskGroupId().longValue() == new Long(researchGroupId).longValue()) {
                    foundRGH = true;
                }
            }
            if (!foundRGH) {
                toDelete.add(rghau);
            }

        }

        for (String taskGroupId : studyBean.getSessionHasTaskGroupRelationshipBean().getSelectedValues()) {

            boolean selectedAlreadyIn = false;
            for (SessionHasTaskGroup rghau : currentlySelected) {
                if (rghau.getTaskGroupId().longValue() == new Long(taskGroupId).longValue()) {
                    selectedAlreadyIn = true;
                }
            }
            if (!selectedAlreadyIn) {
                SessionHasTaskGroup rghau = new SessionHasTaskGroup();
                rghau.setSessionId(studyBean.getId());
                rghau.setTaskGroupId(new Long(taskGroupId));
                toCreate.add(rghau);
            }

        }
        for (SessionHasTaskGroup toCre : toCreate) {
            sessionHasTaskGroupDao.create(toCre);
        }
        for (SessionHasTaskGroup toDel : toDelete) {
            sessionHasTaskGroupDao.delete(toDel);
        }

    }

    public List<Subject> listSubjectsBySessionId(Long sessionId) {
        return subjectDao.listBySessionId(sessionId);
    }


    public void updateSubjectList(SubjectsBean subjectsBean) {
        List<SubjectBean> subjectList = subjectsBean.getSubjectList();
        for (SubjectBean subject : subjectList) {
            subject.setSessionId(subjectsBean.getSessionId());
            if (subject.getId() != null) {
                subjectDao.update(subject);
            } else {
                subjectDao.create(subject);
            }
            List<SubjectAttribute> subjectAttributes = subject.getSubjectAttributes();
            if (subjectAttributes != null) {
                for (SubjectAttribute subjectAttribute : subjectAttributes) {
                    subjectAttribute.setSubjectId(subject.getId());
                    if (subjectAttribute.getId() != null) {
                        subjectAttributeDao.update(subjectAttribute);
                    } else {
                        subjectAttributeDao.create(subjectAttribute);
                    }
                }
            }
        }
        subjectCommunicationService.createSubjectCommunications(subjectsBean.getSessionId(), true);
    }


    public void resetSession(Session session) {

        List<Round> roundList = roundDao.listBySessionId(session.getId());
        for (Round r : roundList) {
            List<Team> teamList = teamDao.listByRoundId(r.getId());

            List<CompletedTask> completedTasks = completedTaskDao.listByRoundId(r.getId());
            for (CompletedTask ct : completedTasks) {

                todoEntryService.deleteTodoEntryByCompletedTaskId(ct.getId());
                votingService.deleteVotingPoolByCompletedTaskId(ct.getId());
                completedTaskAttributeDao.deleteByCompletedTaskId(ct.getId());
                eventLogDao.deleteByCompletedTaskId(ct.getId());
                completedTaskScoreDao.deleteByCompletedTaskId(ct.getId());
            }
            completedTaskDao.deleteByRoundId(r.getId());

            for (Team team : teamList) {
                List<TeamHasSubject> teamHasSubjects = teamHasSubjectDao.listByTeamId(team.getId());
                teamHasSubjectDao.deleteByTeamId(team.getId());
                for (TeamHasSubject ths : teamHasSubjects) {
                    subjectAttributeDao.deleteBySubjectId(ths.getSubjectId());
                }

            }
            teamDao.deleteByRoundId(r.getId());

        }
        roundDao.deleteBySessionId(session.getId());

        SessionRunner sr = SessionRunnerManager.getSessionRunner(session.getId());
        if (sr != null) {
            SessionRunnerManager.removeSessionRunner(session.getId());
        }

        session.setStatus(SessionStatus.NOTSTARTED.getId().toString());
        session.setSessionStartDate(new Timestamp(session.getSessionStartDate().getTime() - 1000 * 60 * 10));
        sessionDao.update(session);

    }
}
