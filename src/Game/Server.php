<?php

declare(strict_types=1);

namespace Smasher\Game;

use Ratchet\ConnectionInterface;
use Ratchet\Wamp\WampServerInterface;

class Server implements WampServerInterface
{
    /**
     * @var array
     */
    protected $playerData = [];

    /**
     * @var Monster
     */
    protected $monster;

    /**
     * @var array
     */
    private $connections;

    public function __construct()
    {
        $this->monster = new Monster();
        $this->connections = [];
    }

    public function onSubscribe(ConnectionInterface $conn, $topic)
    {
    }

    public function onUnSubscribe(ConnectionInterface $conn, $topic)
    {
    }

    public function onOpen(ConnectionInterface $conn)
    {
        $this->connections[$conn->WAMP->sessionId] = $conn;
    }

    public function onClose(ConnectionInterface $conn)
    {
        $sessid = $conn->WAMP->sessionId;
        if (isset($this->playerData[$sessid])) {
            unset($this->playerData[$sessid]);
        }
        unset($this->connections[$conn->WAMP->sessionId]);
    }

    public function onCall(ConnectionInterface $conn, $id, $topic, array $params)
    {
        switch ($topic->getId()) {
            case "synchronize":
                $conn->callResult($id, ['players' => $this->playerData, 'monster' => $this->monster->toArray()]);
                break;
            default:
                $conn->callError($id, $topic, 'You are not allowed to make calls')->close();
        }
    }

    public function onPublish(ConnectionInterface $conn, $topic, $event, array $exclude, array $eligible)
    {
        $sessid = $conn->WAMP->sessionId;
        switch ($topic->getId()) {
            case "char_remove":
                if (isset($this->playerData[$sessid])) {
                    unset($this->playerData[$sessid]);
                }

                break;

            case "char_add":
                break;

            case "char_move":
                $this->playerData[$sessid] = $event;
                if ($this->monster->inCollisionWith($event['x'], $event['y'])) {
                    $this->monster = new Monster();
                    foreach ($this->connections as $connection) {
                        $connection->event('monster_add', $this->monster->toArray());
                    }
                }
                break;

            case "char_msg":
                if ($event['msg'][0] == "/") {
                    $event['heroType'] = substr($event['msg'], 1);
                    $this->playerData[$sessid]['heroType'] = $event['heroType'];
                    $event['msg'] = "";
                    break;
                }
                break;

        }

        $topic->broadcast($event, [$conn->WAMP->sessionId]);
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
    }

    public function getPlayersCount()
    {
        return count($this->connections);
    }
}
