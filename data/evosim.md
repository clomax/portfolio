[Source code](https://github.com/clomax/evosim)

Evosim is an experimental model of an artificial genepool. The main idea is to
simulate co-evolution where creatures are competing for food and mates
simultaneously and directly.

The idea for this project came to me when I started finding similar projects
that caught my attention and reading what others say that they want to see:
interactive artificial life.

This project doesn't have any interactive elements currently, since it's a
prototype of the core elements of the simulation, however this is an aspect
that I intend to explore in the future.

![](assets/images/evosim/s_1.gif)

The simulation starts with a number of randomly generated creatures who evolve
through the process of natural selection, thereby becoming more able swimmers
and making it easier for them to find food and find mates.

Every feature of a creature is determined by its genetic model: a container of
attributes that decide its size, colour, limb structure, and movement pattern.
All of these attributes are subject to change via mutation and crossover when
creatures produce offspring.

![](assets/images/evosim/s_2.gif)

In this prototype I am currently able to run a simulation of approximately 200
creatures which is far more than I expected when I started; I would have
considered myself lucky to be able to have 50.

I used [Unity]() for this prototype because it made it easy to start the
project and see results quickly. I am very happy with the results and would
like to take this further in the future.

I would also like to remake this project more fully using the Bullet physics
engine which, from what I understand, is more suitable for this application
than the physics engine that Unity uses - PhysX.

<iframe style="margin-left: auto; margin-right: auto; display: block" src="//itch.io/embed/17096?linkback=true" width="552" height="167" frameborder="0"></iframe>

