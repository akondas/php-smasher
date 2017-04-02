<?php

declare(strict_types=1);

namespace Smasher\Game;

class Monster
{
    private $type;

    private $x;

    private $y;

    const TYPES = ['ruby', 'python', 'c', 'cplusplus', 'csharp', 'erlang', 'go', 'java', 'javascript'];

    public function __construct()
    {
        $this->type = self::TYPES[random_int(0, count(self::TYPES) - 1)];
        $this->x = random_int(10, 502);
        $this->y = random_int(10, 470);
    }

    public function inCollisionWith($x, $y) : bool
    {
        return $x <= ($this->x + 32)
            && $this->x <= ($x + 32)
            && $y <= ($this->y + 32)
            && $this->y <= ($y + 32);
    }

    public function toArray() : array
    {
        return [
            'type' => $this->type,
            'x' => $this->x,
            'y' => $this->y
        ];
    }
}
