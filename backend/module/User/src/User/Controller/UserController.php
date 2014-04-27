<?php
namespace User\Controller;

use Framework\Template\Exception;
use User\Model\User;
use User\Model\Milestone;
use User\Model\Membership;
use Zend\Mvc\Controller\AbstractRestfulController;
use Zend\Validator\File\Size;
use Zend\View\Model\JsonModel;

class UserController extends AbstractRestfulController
{
    protected $userTable;
    protected $milestoneTable;
    protected $membershipTable;
    protected $eventTable;

    public function getUserTable()
    {
        if (!$this->userTable) {
            $sm = $this->getServiceLocator();
            $this->userTable = $sm->get('User\Model\UserTable');
        }
        return $this->userTable;
    }

    public function getEventTable()
    {
        if (!$this->eventTable) {
            $sm = $this->getServiceLocator();
            $this->eventTable = $sm->get('Event\Model\EventTable');
        }
        return $this->eventTable;
    }

    public function getMilestoneTable()
    {
        if (!$this->milestoneTable) {
            $sm = $this->getServiceLocator();
            $this->milestoneTable = $sm->get('User\Model\MilestoneTable');
        }
        return $this->milestoneTable;
    }

    public function getMembershipTable()
    {
        if (!$this->membershipTable) {
            $sm = $this->getServiceLocator();
            $this->membershipTable = $sm->get('User\Model\MembershipTable');
        }
        return $this->membershipTable;
    }

    public function getList()
    {
        $users = $this->getUserTable()->fetchAll();
        $variables = array();
        $json = new JsonModel();
        foreach ($users as $user) {
            //TODO make this cleaner
            $user->presentOnReunion = (isset($user->presentOnReunion) and $user->presentOnReunion == "1") ? true : false;
            $user->isPhotoBookCandidate = (isset($user->isPhotoBookCandidate) and $user->isPhotoBookCandidate == "1") ? true : false;
            array_push($variables, $user);
        }
        $json->setVariables($variables);
        return $json;
    }

    public function get($id)
    {
        $user = $this->getUserTable()->getUser($id);
        $user->presentOnReunion = (isset($user->presentOnReunion) and $user->presentOnReunion == "1") ? true : false;
        $user->isPhotoBookCandidate = (isset($user->isPhotoBookCandidate) and $user->isPhotoBookCandidate == "1") ? true : false;
        $membershipsFromUser = $this->getMembershipTable()->getMembershipsFromUser($id);
        $membershipsFromUserArray = array();
        foreach($membershipsFromUser as $membership){
            $milestonesFromUser = $this->getMilestoneTable()->getMilestonesFromUserAndGroup($id,$membership->groupid);
            $milestoneAsArray = array();
            foreach($milestonesFromUser as $milestone){
                $event = $this->getEventTable()->getEvent($milestone->eventid);
                $milestone->name = $event->name;
                $milestone->start = $event->start;
                $milestone->end = $event->end;
                $milestone->wasPresent = true;
                array_push($milestoneAsArray,$milestone);
            }
            $membership->setMilestones($milestoneAsArray);
            array_push($membershipsFromUserArray,$membership);
        }
        $user->setMemberships($membershipsFromUserArray);
        return new JsonModel(array("user" => $user));
    }

    public function create($data)
    {
        $variables = array();
        $errors = array();
        //TODO validation
        if (true) {
            $user = new User();
            $user->exchangeArray($data);
            $this->getUserTable()->saveUser($user);
            $variables["success"] = "true";
            $variables["message"] = "User toegevoegd";
        } else {
            $variables["success"] = "false";
            array_push($errors, "Request is not a POST request");
        }
        $variables["errors"] = $errors;
        $json = new JsonModel();
        $json->setVariables($variables);
        return $json;
    }

    public function update($id, $data)
    {
        $user = $this->getUserTable()->getUser($id);
        //TODO validation
        if (true) {
            $user->exchangeArray($data);
            $this->updateUserMilestones($data['milestones'],$id);
            $this->getUserTable()->saveUser($user);
        }

        return new JsonModel(array(
            'data' => $this->get($id),
        ));
    }

    private function updateUserMilestones($milestones,$userid){
        foreach($milestones as $milestone){
            $membership = new Membership();
            $membership->userid = $userid;
            $membership->groupid=$milestone['group'];
            $membership->from=$milestone['from'];
            $membership->to=$milestone['to'];
            $this->getMembershipTable()->saveMembership($membership);
            foreach($milestone['events'] as $event){
                $milestone = new Milestone();
                $milestone->userid =$userid;
                $milestone->eventid =$event['id'];
                $milestone->remarks =$event['description'];
                $this->getMilestoneTable()->saveMilestone($milestone);
            }
        }
    }

    public function delete($id)
    {
        $this->getUserTable()->deleteUser($id);

        return new JsonModel(array(
            'data' => 'deleted',
        ));
    }

    public function login(){
        echo("OK");
    }
}