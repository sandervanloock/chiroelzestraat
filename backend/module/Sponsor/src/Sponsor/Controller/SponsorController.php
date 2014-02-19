<?php
namespace Sponsor\Controller;

use Framework\Template\Exception;
use Sponsor\Model\Sponsor;
use Zend\Mvc\Controller\AbstractRestfulController;
use Zend\Validator\File\Size;
use Zend\View\Model\JsonModel;

class SponsorController extends AbstractRestfulController
{
    protected $sponsorTable;

    public function getSponsorTable()
    {
        if (!$this->sponsorTable) {
            $sm = $this->getServiceLocator();
            $this->sponsorTable = $sm->get('Sponsor\Model\SponsorTable');
        }
        return $this->sponsorTable;
    }

    public function getList()
    {
        $sponsors = $this->getSponsorTable()->fetchAll();
        $variables = array();
        $json = new JsonModel();
        foreach ($sponsors as $sponsor) {
            //TODO make this cleaner
            if ($sponsor->amount == null) {
                $sponsor->amount = 0;
            }
            array_push($variables, $sponsor);
        }
        $json->setVariables($variables);
        return $json;
    }

    public function get($id)
    {
        $sponsor = $this->getSponsorTable()->getSponsor($id);

        return new JsonModel($sponsor);
    }

    public function create($data)
    {
        $variables = array();
        $errors = array();
        //TODO validation
        if (true) {
            $file = $this->params()->fromFiles('file');

            $upload = new \Zend\File\Transfer\Adapter\Http();
            $upload->addValidator('Count', false, array('min' => 1, 'max' => 1))
                ->addValidator('Size', false, array('max' => '512kB'))
                ->setDestination(__DIR__ . './../../../../../uploads');
            if (!$upload->isValid()) {
                throw new Exception('Bad image data: ' . implode(',', $upload->getMessages()));
            }
            try {
                $upload->receive($file['name']);
            } catch (Zend_File_Transfer_Exception $e) {
                throw new Exception('Bad image data: ' . $e->getMessage());
            }
            $sponsor = new Sponsor();
            //TODO what if subdirectory? name = not sufficient
            $post = array_merge_recursive(
                $data,
                array("logo" => $file['name'])
            );
            $sponsor->exchangeArray($post);
            $this->getSponsorTable()->saveSponsor($sponsor);
            $variables["success"] = "true";
            $variables["message"] = "Sponsor toegevoegd";
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
        $data['id'] = $id;
        $sponsor = $this->getSponsorTable()->getSponsor($id);
        //TODO validation
        if (true) {
            $id = $this->getSponsorTable()->saveSponsor($data);
        }

        return new JsonModel($this->get($id));
    }

    public function delete($id)
    {
        $this->getSponsorTable()->deleteSponsor($id);

        return new JsonModel(array(
            'data' => 'deleted',
        ));
    }
}