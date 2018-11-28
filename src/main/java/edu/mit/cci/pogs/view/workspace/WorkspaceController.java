package edu.mit.cci.pogs.view.workspace;

import org.jooq.tools.json.JSONArray;
import org.jooq.tools.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.awt.*;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import edu.mit.cci.pogs.model.dao.chatchannel.ChatChannelDao;
import edu.mit.cci.pogs.model.dao.completedtask.CompletedTaskDao;
import edu.mit.cci.pogs.model.dao.completedtaskscore.CompletedTaskScoreDao;
import edu.mit.cci.pogs.model.dao.eventlog.EventLogDao;
import edu.mit.cci.pogs.model.dao.round.RoundDao;
import edu.mit.cci.pogs.model.dao.session.CommunicationConstraint;
import edu.mit.cci.pogs.model.dao.session.ScoreboardDisplayType;
import edu.mit.cci.pogs.model.dao.session.SessionScheduleType;
import edu.mit.cci.pogs.model.dao.session.SessionStatus;
import edu.mit.cci.pogs.model.dao.session.TaskExecutionType;
import edu.mit.cci.pogs.model.dao.subject.SubjectDao;
import edu.mit.cci.pogs.model.dao.subjectattribute.SubjectAttributeDao;
import edu.mit.cci.pogs.model.dao.subjectcommunication.SubjectCommunicationDao;
import edu.mit.cci.pogs.model.dao.subjecthaschannel.SubjectHasChannelDao;
import edu.mit.cci.pogs.model.dao.task.TaskDao;
import edu.mit.cci.pogs.model.dao.taskconfiguration.TaskConfigurationDao;
import edu.mit.cci.pogs.model.dao.taskexecutionattribute.TaskExecutionAttributeDao;
import edu.mit.cci.pogs.model.dao.taskhastaskconfiguration.TaskHasTaskConfigurationDao;
import edu.mit.cci.pogs.model.dao.taskplugin.TaskPlugin;
import edu.mit.cci.pogs.model.dao.team.TeamDao;
import edu.mit.cci.pogs.model.jooq.tables.pojos.ChatChannel;
import edu.mit.cci.pogs.model.jooq.tables.pojos.CompletedTask;
import edu.mit.cci.pogs.model.jooq.tables.pojos.CompletedTaskScore;
import edu.mit.cci.pogs.model.jooq.tables.pojos.EventLog;
import edu.mit.cci.pogs.model.jooq.tables.pojos.Round;
import edu.mit.cci.pogs.model.jooq.tables.pojos.Session;
import edu.mit.cci.pogs.model.jooq.tables.pojos.Subject;
import edu.mit.cci.pogs.model.jooq.tables.pojos.SubjectAttribute;
import edu.mit.cci.pogs.model.jooq.tables.pojos.SubjectCommunication;
import edu.mit.cci.pogs.model.jooq.tables.pojos.SubjectHasChannel;
import edu.mit.cci.pogs.model.jooq.tables.pojos.Task;
import edu.mit.cci.pogs.model.jooq.tables.pojos.TaskConfiguration;
import edu.mit.cci.pogs.model.jooq.tables.pojos.TaskExecutionAttribute;
import edu.mit.cci.pogs.model.jooq.tables.pojos.TaskHasTaskConfiguration;
import edu.mit.cci.pogs.model.jooq.tables.pojos.Team;
import edu.mit.cci.pogs.model.jooq.tables.pojos.TeamHasSubject;
import edu.mit.cci.pogs.runner.SessionRunner;
import edu.mit.cci.pogs.runner.SessionRunnerManager;
import edu.mit.cci.pogs.runner.wrappers.RoundWrapper;
import edu.mit.cci.pogs.runner.wrappers.SessionWrapper;
import edu.mit.cci.pogs.runner.wrappers.TaskScoreWrapper;
import edu.mit.cci.pogs.runner.wrappers.TaskWrapper;
import edu.mit.cci.pogs.runner.wrappers.TeamWrapper;
import edu.mit.cci.pogs.service.SessionService;
import edu.mit.cci.pogs.service.TeamService;
import edu.mit.cci.pogs.service.WorkspaceService;
import edu.mit.cci.pogs.utils.ColorUtils;

@Controller
public class WorkspaceController {

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private SubjectDao subjectDao;

    @Autowired
    private TaskDao taskDao;

    @Autowired
    private CompletedTaskDao completedTaskDao;

    @Autowired
    private CompletedTaskScoreDao completedTaskScoreDao;

    @Autowired
    private EventLogDao eventLogDao;

    @Autowired
    private TaskHasTaskConfigurationDao taskHasTaskConfigurationDao;

    @Autowired
    private TaskExecutionAttributeDao taskExecutionAttributeDao;

    @Autowired
    private SubjectAttributeDao subjectAttributeDao;

    @Autowired
    private TeamService teamService;

    @Autowired
    private TeamDao teamDao;

    @Autowired
    private RoundDao roundDao;

    @Autowired
    private SubjectHasChannelDao subjectHasChannelDao;

    @Autowired
    private ChatChannelDao chatChannelDao;

    @Autowired
    private SubjectCommunicationDao subjectCommunicationDao;

    @Autowired
    private TaskConfigurationDao taskConfigurationDao;

    @Autowired
    private SessionService sessionService;

    @PostMapping("/check_in")
    public String register(@RequestParam("externalId") String externalId, Model model) {

        Subject su;
        //check if subject is from perpetual session.
        Session session = sessionService.getPerpetualSessionForSubject(externalId);
        if (session != null) {
            su = new Subject();
            su.setSubjectExternalId(externalId);
            su.setSessionId(session.getId());
        } else {

            su = workspaceService.getSubject(externalId);
            if (su == null) {
                model.addAttribute("errorMessage", "This id was not recognized.");
                return "workspace/error";
            }
        }
        SessionRunner sr = SessionRunnerManager.getSessionRunner(su.getSessionId());
        if (sr == null) {
            model.addAttribute("errorMessage", "Too early.");
            return "workspace/error";
        }
        if (sr.getSession().getStatus().equals(SessionStatus.DONE.getStatus())) {
            model.addAttribute("errorMessage", "Your session has ended!");
            return "workspace/error";
        }
        if (sr.getSession().isTooLate()) {
            model.addAttribute("errorMessage", "You are too late, your session has already passed!");
            return "workspace/error";
        }

        sr.subjectCheckIn(su);
        return "redirect:/waiting_room/" + su.getSubjectExternalId();
    }

    @GetMapping("/waiting_room/{externalId}")
    public String waitingRoom(@PathVariable("externalId") String externalId, Model model) {
        Subject su = workspaceService.getSubject(externalId);
        if(su == null) {
            Session session = sessionService.getPerpetualSessionForSubject(externalId);

            if (session != null) {
                su = new Subject();
                su.setSubjectExternalId(externalId);
                su.setSessionId(session.getId());
            } else {
                model.addAttribute("errorMessage", "There was an error and your session has ended!");
                return "workspace/error";
            }
        }


        return checkExternalIdAndSessionRunningAndForward(su, model, "workspace/waiting_room");
    }

    private String checkExternalIdAndSessionRunningAndForward(Subject su, Model model, String forwardString) {

        if (su != null) {

            SessionRunner sr = SessionRunnerManager.getSessionRunner(su.getSessionId());
            if (sr != null && !sr.getSession().getStatus().equals(SessionStatus.DONE.getStatus())) {
                model.addAttribute("subject", su);
                model.addAttribute("pogsSession", sr.getSession());
                model.addAttribute("pogsSessionPerpetual", (sr.getSession().getSessionScheduleType().equals(
                        SessionScheduleType.PERPETUAL.getId().toString())));

                model.addAttribute("secondsRemainingCurrentUrl", sr.getSession().getSecondsRemainingForCurrentUrl());
                model.addAttribute("nextUrl", sr.getSession().getNextUrl());
                return forwardString;
            } else {
                return handleErrorMessage("Your session has ended!", model);
            }
        }

        return handleErrorMessage("This id was not recognized!", model);

    }

    @GetMapping("/intro/{externalId}")
    public String intro(@PathVariable("externalId") String externalId, Model model) {
        Subject su = workspaceService.getSubject(externalId);
        //handle no TEAM FOR subject
        return checkExternalIdAndSessionRunningAndForward(su, model, "workspace/session_intro");

    }

    @GetMapping("/display_name/{externalId}")
    public String displayName(@PathVariable("externalId") String externalId, Model model) {
        Subject su = workspaceService.getSubject(externalId);
        return checkExternalIdAndSessionRunningAndForward(su, model, "workspace/display_name");


    }

    @PostMapping("/display_name/{externalId}")
    public String displayNamePost(@PathVariable("externalId") String externalId, @RequestParam("displayName") String displayName, Model model) {
        Subject su = workspaceService.getSubject(externalId);
        if (su != null) {
            su.setSubjectDisplayName(displayName);
            subjectDao.update(su);
        }

        return checkExternalIdAndSessionRunningAndForward(su, model, "workspace/display_name");
    }

    @GetMapping("/roster/{externalId}")
    public String roster(@PathVariable("externalId") String externalId, Model model) {
        Subject su = workspaceService.getSubject(externalId);
        String ret = checkExternalIdAndSessionRunningAndForward(su, model, "workspace/team_roster");

        if (su != null) {
            //discover subject team

            List<Subject> teammates = teamService.getTeamSubjects(su.getId(), su.getSessionId(), null, null);
            model.addAttribute("teammates", teammates);

        }

        return ret;
    }

    private String handleErrorMessage(String message, Model model) {
        model.addAttribute("errorMessage", message);
        return "workspace/error";
    }

    private String checkSubjectSessionTaskAndForward(Subject su,
                                                     Task task, String forward, Model model) {
        if (su == null) {
            return handleErrorMessage("There was an error and your session has ended!", model);
        }
        SessionRunner sr = SessionRunnerManager.getSessionRunner(su.getSessionId());
        if (sr != null && !sr.getSession().getStatus().equals(SessionStatus.DONE.getStatus())) {
            if (task != null) {
                model.addAttribute("task", task);
                model.addAttribute("subject", su);
                model.addAttribute("pogsSession", sr.getSession());
                model.addAttribute("secondsRemainingCurrentUrl",
                        sr.getSession().getSecondsRemainingForCurrentUrl());
                model.addAttribute("nextUrl", sr.getSession().getNextUrl());
                return forward;
            } else {
                return handleErrorMessage("There was an error and your session has ended!", model);
            }
        } else {
            return handleErrorMessage("There was an error and your session has ended!", model);
        }
    }

    @GetMapping("/round/{roundId}/task/{taskId}/i/{subjectExternalId}")
    public String taskIntro(@PathVariable("roundId") Long roundId,
                            @PathVariable("taskId") Long taskId,
                            @PathVariable("subjectExternalId") String subjectExternalId,
                            Model model) {

        Task task = taskDao.get(taskId);
        Subject su = workspaceService.getSubject(subjectExternalId);

        return checkSubjectSessionTaskAndForward(su, task, "workspace/task_intro", model);


    }

    @GetMapping("/round/{roundId}/task/{taskId}/p/{subjectExternalId}")
    public String taskPrimer(@PathVariable("taskId") Long taskId,
                             @PathVariable("subjectExternalId") String subjectExternalId,
                             Model model) {

        Task task = taskDao.get(taskId);
        Subject su = workspaceService.getSubject(subjectExternalId);

        TaskPlugin pl = TaskPlugin.getTaskPlugin(task.getTaskPluginType());

        model.addAttribute("taskCss", pl.getTaskCSSContent());
        model.addAttribute("taskPrimerJs", pl.getTaskPrimerJsContent());
        model.addAttribute("taskPrimerHtml", pl.getTaskPrimerHtmlContent());

        TaskHasTaskConfiguration configuration = taskHasTaskConfigurationDao
                .getByTaskId(task.getId());
        List<TaskExecutionAttribute> taskExecutionAttributes = taskExecutionAttributeDao
                .listByTaskConfigurationId(configuration.getTaskConfigurationId());

        model.addAttribute("taskConfigurationAttributes",
                attributesToJsonArray(taskExecutionAttributes));
        return checkSubjectSessionTaskAndForward(su, task, "workspace/task_primer", model);

    }

    private static JSONArray attributesToJsonArray(List<TaskExecutionAttribute> taskExecutionAttributes) {
        JSONArray configurationArray = new JSONArray();
        for (TaskExecutionAttribute tea : taskExecutionAttributes) {
            JSONObject teaJson = new JSONObject();
            teaJson.put("attributeName", tea.getAttributeName());
            teaJson.put("stringValue", tea.getStringValue());
            teaJson.put("doubleValue", tea.getDoubleValue());
            teaJson.put("integerValue", tea.getIntegerValue());
            configurationArray.add(teaJson);


        }
        return configurationArray;
    }

    private Subject generateFakeSubject(String subjectExternalId) {
        Subject su = new Subject();
        su.setSubjectExternalId(subjectExternalId);
        su.setSubjectDisplayName(subjectExternalId);
        return su;
    }

    @GetMapping("/task/{taskId}/t/{subjectExternalId}")
    public String taskConfigTest(@PathVariable("taskId") Long taskId,
                                 @PathVariable("subjectExternalId") String subjectExternalId,
                                 Model model) {

        Task task = taskDao.get(taskId);
        TaskPlugin pl = TaskPlugin.getTaskPlugin(task.getTaskPluginType());
        if (pl != null) {
            //get task configurations
            TaskHasTaskConfiguration configuration = taskHasTaskConfigurationDao
                    .getByTaskId(task.getId());
            List<TaskExecutionAttribute> taskExecutionAttributes = taskExecutionAttributeDao
                    .listByTaskConfigurationId(configuration.getTaskConfigurationId());

            model.addAttribute("task", new TaskWrapper(task));
            model.addAttribute("taskConfigurationAttributes",
                    attributesToJsonArray(taskExecutionAttributes));

            JSONArray allLogs = new JSONArray();
            model.addAttribute("eventsUntilNow", allLogs);

            //get task html & js from plugin file system
            model.addAttribute("taskCss", pl.getTaskCSSContent());
            model.addAttribute("taskWorkJs", pl.getTaskWorkJsContent());
            model.addAttribute("taskWorkHtml", pl.getTaskWorkHtmlContent());

            model.addAttribute("subject", generateFakeSubject(subjectExternalId));
            model.addAttribute("teammates", getFakeTeamatesJSONObject());

            JSONArray ja = new JSONArray();
            ja.add("su01");
            ja.add("su02");
            ja.add("su03");
            ja.add("su04");

            model.addAttribute("subjectCanTalkTo", ja);

            model.addAttribute("hasCollaborationTodoListEnabled",
                    task.getCollaborationTodoListEnabled());
            model.addAttribute("hasCollaborationFeedbackWidget",
                    task.getCollaborationFeedbackWidgetEnabled());
            model.addAttribute("hasCollaborationVotingWidget",
                    task.getCollaborationVotingWidgetEnabled());

            String cc = task.getCommunicationType();
            List<TaskWrapper> fakeTaskList = new ArrayList<>();
            TaskWrapper tw = new TaskWrapper();
            tw.setTaskName("Task name");
            tw.setId(01l);
            fakeTaskList.add(tw);

            tw = new TaskWrapper();
            tw.setTaskName("Task name 2");
            tw.setId(02l);
            fakeTaskList.add(tw);
            model.addAttribute("allTasksList", getJsonTaskList(fakeTaskList));

            model.addAttribute("lastTask", "");

            model.addAttribute("communicationType", cc);
            model.addAttribute("hasChat", (cc != null && !cc.equals(CommunicationConstraint
                    .NO_CHAT.getId().toString()) ? (true) : (false)));

        }

        return "workspace/task_workpreview";
    }

    @GetMapping("/taskplugin/{taskPlugin}/{pluginConfig}/w/{subjectExternalId}")
    public String taskWorkPluginTest(
            @PathVariable("taskPlugin") String taskPlugin,
            @PathVariable("pluginConfig") String pluginConfig,
            @PathVariable("subjectExternalId") String subjectExternalId,
            Model model) {
        TaskPlugin pl = TaskPlugin.getTaskPlugin(taskPlugin);
        if (pl != null) {
            //get task configurations
            TaskConfiguration tc = taskConfigurationDao.getByTaskPluginConfigurationName(pluginConfig);

            List<TaskExecutionAttribute> taskExecutionAttributes = taskExecutionAttributeDao
                    .listByTaskConfigurationId(tc.getId());


            model.addAttribute("taskConfigurationAttributes",
                    attributesToJsonArray(taskExecutionAttributes));
            //get task html & js from plugin file system
            model.addAttribute("taskCss", pl.getTaskCSSContent());
            model.addAttribute("taskWorkJs", pl.getTaskWorkJsContent());
            model.addAttribute("taskWorkHtml", pl.getTaskWorkHtmlContent());


            JSONArray allLogs = new JSONArray();

            model.addAttribute("eventsUntilNow", allLogs);

            model.addAttribute("subject", generateFakeSubject(subjectExternalId));


            model.addAttribute("teammates", getFakeTeamatesJSONObject());

            List<TaskWrapper> fakeTaskList = new ArrayList<>();
            TaskWrapper tw = new TaskWrapper();
            tw.setTaskName("Task name");
            tw.setId(01l);
            fakeTaskList.add(tw);

            tw = new TaskWrapper();
            tw.setTaskName("Task name 2");
            tw.setId(02l);
            fakeTaskList.add(tw);
            model.addAttribute("allTasksList", getJsonTaskList(fakeTaskList));

            model.addAttribute("lastTask", "");


        }

        return "workspace/task_workplugin";
    }

    private JSONArray getFakeTeamatesJSONObject() {
        List<Subject> teammates = new ArrayList<>();
        teammates.add(generateFakeSubject("su01"));
        teammates.add(generateFakeSubject("su02"));
        teammates.add(generateFakeSubject("su03"));
        teammates.add(generateFakeSubject("su04"));

        JSONArray ja = new JSONArray();
        Color[] colors = ColorUtils.generateVisuallyDistinctColors(
                10,
                ColorUtils.MIN_COMPONENT, ColorUtils.MAX_COMPONENT);
        int colorIndex = 0;
        for (Subject s : teammates) {
            JSONObject subject = new JSONObject();
            subject.put("externalId", s.getSubjectExternalId());
            subject.put("displayName", s.getSubjectDisplayName());

            JSONArray subjectAttributes = new JSONArray();

            JSONObject att = new JSONObject();
            Color color = colors[colorIndex];
            att.put("attributeName", ColorUtils.SUBJECT_DEFAULT_BACKGROUND_COLOR_ATTRIBUTE_NAME);

            att.put("stringValue",
                    String.format("#%02x%02x%02x", color.getRed(),
                            color.getGreen(), color.getBlue())
            );
            subjectAttributes.add(att);

            att = new JSONObject();

            color = ColorUtils.generateFontColorBasedOnBackgroundColor(colors[colorIndex]);
            att.put("attributeName", ColorUtils.SUBJECT_DEFAULT_FONT_COLOR_ATTRIBUTE_NAME);
            att.put("stringValue", String.format("#%02x%02x%02x", color.getRed(),
                    color.getGreen(), color.getBlue()));
            colorIndex++;

            subjectAttributes.add(att);

            att = new JSONObject();
            att.put("attributeName", "age");
            att.put("stringValue", "13");
            subjectAttributes.add(att);

            att = new JSONObject();
            att.put("attributeName", "education");
            att.put("stringValue", "Graduate");
            subjectAttributes.add(att);


            subject.put("attributes", subjectAttributes);
            ja.add(subject);
        }
        return ja;
    }

    @GetMapping("/round/{roundId}/task/{taskId}/w/{subjectExternalId}")
    public String taskWork(@PathVariable("roundId") Long roundId,
                           @PathVariable("taskId") Long taskId,
                           @PathVariable("subjectExternalId") String subjectExternalId,
                           Model model) {


        Task task = taskDao.get(taskId);
        Subject su = workspaceService.getSubject(subjectExternalId);
        Round round = roundDao.get(roundId);


        List<SubjectCommunication> subjectCommunications =
                subjectCommunicationDao.listByFromSubjectId(su.getId());

        JSONArray allowedToTalkTo = new JSONArray();
        if (subjectCommunications != null) {
            for (SubjectCommunication sc : subjectCommunications) {
                Subject subject = subjectDao.get(sc.getToSubjectId());
                if (sc.getAllowed()) {
                    if (sc.getToSubjectId() != sc.getFromSubjectId()) {
                        allowedToTalkTo.add(subject.getSubjectExternalId());
                    }
                }
            }
        }
        //get Channels user is allowed to talk to

        List<SubjectHasChannel> subjectHasChannels = subjectHasChannelDao.listBySubjectId(su.getId());
        JSONArray channelSubjectIsIn = new JSONArray();
        if (subjectHasChannels != null) {
            for (SubjectHasChannel shc : subjectHasChannels) {
                ChatChannel chatChannel = chatChannelDao.get(shc.getChatChannelId());
                channelSubjectIsIn.add(chatChannel.getChannelName());
            }
        }


        if (task != null && round != null) {
            //get task plugin type task.getTaskPluginType()
            TaskPlugin pl = TaskPlugin.getTaskPlugin(task.getTaskPluginType());
            if (pl != null) {
                //get task configurations
                TaskHasTaskConfiguration configuration = taskHasTaskConfigurationDao
                        .getByTaskId(task.getId());
                List<TaskExecutionAttribute> taskExecutionAttributes = taskExecutionAttributeDao
                        .listByTaskConfigurationId(configuration.getTaskConfigurationId());


                //get task html & js from plugin file system
                model.addAttribute("taskCss", pl.getTaskCSSContent());
                model.addAttribute("taskWorkJs", pl.getTaskWorkJsContent());
                model.addAttribute("taskWorkHtml", pl.getTaskWorkHtmlContent());

                model.addAttribute("subject", su);
                model.addAttribute("subjectCanTalkTo", allowedToTalkTo);
                model.addAttribute("channelSubjectIsIn", channelSubjectIsIn);


                model.addAttribute("task", new TaskWrapper(task));
                model.addAttribute("round", new RoundWrapper(round));

                model.addAttribute("taskConfigurationAttributes",
                        attributesToJsonArray(taskExecutionAttributes));

                SessionRunner sr = SessionRunnerManager.getSessionRunner(su.getSessionId());
                SessionWrapper sessionWrapper = sr.getSession();

                if (sr == null) {
                    return handleErrorMessage("There was an error and your " +
                            "session has ended!", model);
                }
                model.addAttribute("pogsSession", sessionWrapper);

                if (sessionWrapper.isTaskExecutionModeParallel()) {
                    model.addAttribute("hasTabs", true);
                    model.addAttribute("taskList", sessionWrapper.getTaskList());
                    //add all tasks
                } else {
                    model.addAttribute("hasTabs", false);
                }

                if (sessionWrapper.getTaskExecutionType().equals(TaskExecutionType.PARALLEL_FIXED_ORDER.getId().toString())) {
                    model.addAttribute("lastTask", "");
                } else {
                    TaskWrapper lastTask = null;
                    for (int i = 0; i < sessionWrapper.getTaskList().size(); i++) {
                        TaskWrapper tw = sessionWrapper.getTaskList().get(i);

                        if (tw.getId() == task.getId()) {
                            if (i == 0) {
                                model.addAttribute("lastTask", "");
                            } else {
                                model.addAttribute("lastTask", sessionWrapper.getTaskList().get(i - 1).getTaskName());
                            }
                        }
                    }
                }
                model.addAttribute("allTasksList", getJsonTaskList(sessionWrapper.getTaskList()));
                String cc = sessionWrapper.getCommunicationType();
                if (task.getCommunicationType() != null || !task.getCommunicationType().equals(cc)) {
                    cc = task.getCommunicationType();
                }

                model.addAttribute("communicationType", cc);
                model.addAttribute("chatBotName", sessionWrapper.getChatBotName());
                model.addAttribute("hasChat", (cc != null && !cc.equals(CommunicationConstraint
                        .NO_CHAT.getId().toString()) ? (true) : (false)));

                boolean hasCollaborationTodoListEnabled = sessionWrapper
                        .getCollaborationTodoListEnabled();
                if (task.getCollaborationTodoListEnabled() != null) {
                    hasCollaborationTodoListEnabled = task.getCollaborationTodoListEnabled();
                }
                model.addAttribute("hasCollaborationTodoListEnabled", hasCollaborationTodoListEnabled);

                boolean hasCollaborationFeedbackWidget = sessionWrapper
                        .getCollaborationFeedbackWidgetEnabled();


                if (task.getCollaborationFeedbackWidgetEnabled() != null) {
                    hasCollaborationFeedbackWidget = task.getCollaborationFeedbackWidgetEnabled();
                }
                model.addAttribute("hasCollaborationFeedbackWidget", hasCollaborationFeedbackWidget);

                boolean hasCollaborationVotingWidget = sessionWrapper
                        .getCollaborationVotingWidgetEnabled();

                if (task.getCollaborationVotingWidgetEnabled() != null) {
                    hasCollaborationVotingWidget = task.getCollaborationVotingWidgetEnabled();
                }

                model.addAttribute("hasCollaborationVotingWidget", hasCollaborationVotingWidget);

                model.addAttribute("secondsRemainingCurrentUrl",
                        sr.getSession().getSecondsRemainingForCurrentUrl());
                model.addAttribute("nextUrl", sr.getSession().getNextUrl());

                Team team = teamDao.getSubjectTeam(su.getId(), sessionWrapper.getId(), round.getId(), task.getId());
                if (team == null) {
                    team = teamDao.getSubjectTeam(su.getId(), sessionWrapper.getId(), round.getId(), null);
                    if (team == null) {
                        team = teamDao.getSubjectTeam(su.getId(), sessionWrapper.getId(), null, null);
                    }
                }
                if(team == null){
                    return handleErrorMessage(sessionWrapper.getCouldNotAssignToTeamMessage(), model);
                }
                CompletedTask completedTask = completedTaskDao.getByRoundIdTaskIdTeamId(
                        round.getId(),
                        team.getId(),
                        task.getId());
                if (completedTask == null) {
                    completedTask = completedTaskDao.getBySubjectIdTaskId(su.getId(), taskId);
                }

                List<Subject> teammates = teamService.getTeamSubjects(su.getId(), su.getSessionId(),
                        round.getId(), task.getId());

                if (teammates == null || teammates.size() == 0) {
                    teammates = teamService.getTeamSubjects(su.getId(), su.getSessionId(),
                            round.getId(), null);
                }
                if (teammates == null || teammates.size() == 0) {
                    teammates = teamService.getTeamSubjects(su.getId(), su.getSessionId(),
                            null, null);
                }

                model.addAttribute("teammates", getTeamatesJSONObject(teammates));
                model.addAttribute("completedTask", completedTask);


                List<EventLog> allLogsUntilNow = eventLogDao.listLogsUntil(completedTask.getId(), new Date());
                JSONArray allLogs = new JSONArray();
                for (EventLog el : allLogsUntilNow) {
                    allLogs.add(getLogJson(el));
                }

                model.addAttribute("eventsUntilNow", allLogs);

            } else {
                return handleErrorMessage("There was an error and your session has ended!", model);
            }

        }

        return "workspace/task_work";
    }

    private JSONArray getJsonTaskList(List<TaskWrapper> taskList) {
        JSONArray ja = new JSONArray();
        for (TaskWrapper tw : taskList) {
            JSONObject jo = new JSONObject();
            jo.put("taskName", tw.getTaskName());
            jo.put("id", tw.getId());
            ja.add(jo);
        }
        return ja;
    }

    private JSONObject getLogJson(EventLog el) {
        JSONObject event = new JSONObject();
        event.put("sender", el.getSender());
        event.put("receiver", el.getReceiver());

        event.put("content", el.getEventContent());
        event.put("completedTaskId", el.getCompletedTaskId());
        event.put("sessionId", el.getSessionId());
        event.put("type", el.getEventType());
        return event;
    }

    private JSONArray getTeamatesJSONObject(List<Subject> teammates) {
        JSONArray ja = new JSONArray();
        for (Subject s : teammates) {
            JSONObject subject = new JSONObject();
            subject.put("externalId", s.getSubjectExternalId());
            subject.put("displayName", s.getSubjectDisplayName());
            JSONArray subjectAttributes = new JSONArray();
            List<SubjectAttribute> attributes = subjectAttributeDao.listBySubjectId(s.getId());
            for (SubjectAttribute sa : attributes) {
                JSONObject att = new JSONObject();
                att.put("attributeName", sa.getAttributeName());
                att.put("stringValue", sa.getStringValue());
                att.put("integerValue", sa.getIntegerValue());
                att.put("realValue", sa.getRealValue());
                subjectAttributes.add(att);
            }
            subject.put("attributes", subjectAttributes);
            ja.add(subject);
        }
        return ja;
    }

    @GetMapping("/done/{externalId}")
    public String done(@PathVariable("externalId") String externalId, Model model) {
        Subject su = workspaceService.getSubject(externalId);
        SessionRunner sr = SessionRunnerManager.getSessionRunner(su.getSessionId());

        if (sr != null) {

            if (sr.getSession().getScoreboardDisplayType().equals(ScoreboardDisplayType.
                    DISPLAY_SESSION.getId().toString())) {

                List<TeamWrapper> teamWrappers = sr.getSession()
                        .getSessionRounds().get(0).getRoundTeams();

                List<TaskScoreWrapper> taskScoreWrappers = new ArrayList<>();

                for (TaskWrapper tw : sr.getSession().getTaskList()) {

                    if (tw.getShouldScore()) {
                        //get all scores in the team's order
                        TaskScoreWrapper tsw = new TaskScoreWrapper();
                        tsw.setTaskWrapper(tw);
                        tsw.setTeamScore(new ArrayList<>());

                        Map<Long, Double> teamScore = new HashMap<>();
                        for (TeamWrapper tew : teamWrappers) {
                            teamScore.put(tew.getTeam().getId(), 0d);
                        }

                        for (CompletedTask ct : tw.getCompletedTasks()) {
                            CompletedTaskScore cts = completedTaskScoreDao
                                    .getByCompletedTaskId(ct.getId());
                            if(cts!=null) {
                                if (ct.getSubjectId() == null) {
                                    teamScore.put(ct.getTeamId(), cts.getTotalScore());
                                } else {
                                    if (ct.getSubjectId().equals(su.getId())) {
                                        teamScore.put(ct.getTeamId(), cts.getTotalScore());
                                    }
                                }
                            }
                        }
                        for (TeamWrapper tew : teamWrappers) {
                            tsw.getTeamScore().add(teamScore.get(tew.getTeam().getId()));
                        }

                        taskScoreWrappers.add(tsw);

                    }
                }
                int subjectsTeam = 0;
                for (int i = 0; i < teamWrappers.size(); i++) {
                    for (Subject sub : teamWrappers.get(i).getSubjects()) {
                        if (sub.getId() == su.getId()) {
                            subjectsTeam = i;
                        }
                    }
                }
                model.addAttribute("subjectsTeamIndex", subjectsTeam);
                model.addAttribute("showSubjectName", sr.getSession().getScoreboardUseDisplayNames());
                model.addAttribute("showScore", true);
                model.addAttribute("taskScoreWrappers", taskScoreWrappers);
                model.addAttribute("teamWrappers", teamWrappers);

            } else {
                model.addAttribute("showScore", false);
            }
        }
        return checkExternalIdAndSessionRunningAndForward(su, model,
                "workspace/session_done");

    }

}