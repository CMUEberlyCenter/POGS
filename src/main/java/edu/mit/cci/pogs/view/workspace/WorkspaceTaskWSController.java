package edu.mit.cci.pogs.view.workspace;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

import edu.mit.cci.pogs.messages.PogsMessage;
import edu.mit.cci.pogs.messages.TaskAttributeMessage;
import edu.mit.cci.pogs.service.CompletedTaskAttributeService;

@Controller
public class WorkspaceTaskWSController {

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    @Autowired
    private CompletedTaskAttributeService completedTaskAttributeService;

    @MessageMapping("/task.saveAttribute")
    public void getLoggableAttribute(@Payload TaskAttributeMessage taskAttributeMessage) {
        if(taskAttributeMessage.getType().equals(PogsMessage.MessageType.TASK_ATTRIBUTE)) {
            String externalId = taskAttributeMessage.getSender();
            Long completedTaskId = Long.parseLong(taskAttributeMessage.getCompletedTaskId());
            Long sessionId = Long.parseLong(taskAttributeMessage.getSessionId());

            //Subject subject = workspaceService.getSubject(externalId);
            //if loggable attribute
            if(taskAttributeMessage.getLoggableAttribute()){
                //check if attribute exits



                completedTaskAttributeService.createOrUpdate(
                        taskAttributeMessage.getAttributeName(),
                        taskAttributeMessage.getAttributeStringValue(),
                        taskAttributeMessage.getAttributeDoubleValue(),
                        taskAttributeMessage.getAttributeIntegerValue(),
                        Long.parseLong(taskAttributeMessage.getCompletedTaskId())
                );

            }


            messagingTemplate.convertAndSend("/topic/public/task/"+completedTaskId + "/work", taskAttributeMessage);
        }
    }
}
