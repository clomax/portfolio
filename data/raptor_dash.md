Raptor Dash is an infinite runner game featuring the
skeletons of a velociraptor that has come to life running
through a museum. The aim of the project is to work with an
illustrator to produce a complete game.

The first step I made is animating a dinosaur skeleton. I made
placeholder bones, rigged them to a 2D inverse kinematics script,
and used Unity's built in animator to create the run cycle below.

[![](assets/images/raptor_dash/EminentHugeCrow.jpg =600x)](https://gfycat.com/EminentHugeCrow)

After that I made a simple prototype in which the dinosaur can dodge
oncoming obstacles by switching between three lanes. If the dinosaur runs
into in obstacle it will fall to pieces.

[![](assets/images/raptor_dash/ConsiderateGoodnaturedIndianhare.png =600x)](https://gfycat.com/ConsiderateGoodnaturedIndianhare)

Once I had practiced a workflow for animating I started working on
animating the final velociraptor, which had more joints in its legs,
neck, and tail. I also brought in the other assets and created the
environment with scrolling textures for the barriers and windows, and
animated dust motes with particle systems. The video below shows that I
can manipulate IK targets, combined with Unity's animation system, to
create a more complex run cycle.

[![](assets/images/raptor_dash/leg.png =600x)](https://gfycat.com/ThoroughJauntyInchworm)

[![](assets/images/raptor_dash/smash.png =600x)](https://gfycat.com/ReadyPracticalAfricanpiedkingfisher)

<!-- TODO: another video of dino smashing to pieces -->

In the above video the player knocks the obstacles over without
breaking apart if they are hit from the side, but does break apart,
if the player runs into an obstacle head-on.

<iframe style="margin-left: auto; margin-right: auto; display: block" src="https://itch.io/embed/45389?linkback=true" width="552" height="167" frameborder="0"></iframe>
