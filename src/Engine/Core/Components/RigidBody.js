import Actor from "@/engine/game/actors/Actor";
import { SphereGeometry, Vector3 } from "three";

class RigidBody extends Actor {

    options = {
        gravity: true,
        gravityOrigin: new Vector3(0, 0, 0), // Passer plutôt une entity directement et elle aura sa masse, son centre, sa force et ses propres constantes
        mass: 1,
        enableCollision: true,
        enableCollisionResponse: true
    };

    gravityConstant = 9.81;
    gravityOrigin = new Vector3(0, 0, 0);

    mass = 1;
    acceleration = new Vector3(0, 0, 0);
    lastPosition = new Vector3(0, 0, 0);
    velocity = new Vector3(0, 0, 0);
    friction = .999;
    isRigidBody = true;
    energy = 1; // Todo calculer l'enrgie par rapport à la masse

    dt = .1;

    // _gravity: number = -1
    // _acceleration: number = 0
    // _lastPosition: number = 1

    constructor(options) {
        super(options);

        if (options) {
            this.options = { ...this.options, ...options };
        }

        this.initialize();
        if (this.options.gravityOrigin) {
            this.gravityOrigin = this.options.gravityOrigin;
        }

    }

    initialize() {
        this.mass = this.options.mass || 1;
        if (this.geometry) {
            this.mass = (4 / 3) * Math.PI * Math.pow(this.geometry.parameters.radius / 2, 3);
        }
    }

    updateRigidBody(tick) {
        this.applyGravity();
        // this.updatePosition(tick)
        // for (let i = 0  ; i < 20 ; i++) {
        // this.calculateCollision()
        this.updatePosition(tick);
        // }

    }

    calculateCollision() {

        // if (window.__jeesee__.game?.scene?.sceneManager) {
        //     let entities = window.__jeesee__.game.scene?.sceneManager.entities;

        //     let radius = this.geometry.parameters.radius;

        //     entities.forEach((entity) => { // Todo : Trouver un moyen de ne pas toutes les parcourir

        //         if (this.object && entity !== this) { // Ne pas calculer sur l'entité en cours


        //             if (entity && entity.object && entity.geometry && entity instanceof RigidBody && this instanceof RigidBody) {

        //                 // Calcule les collisions si elles sont activées
        //                 if (this.options.enableCollision) {

        //                     if (entity.geometry instanceof SphereGeometry) {

        //                         let penetrationDepth = entity.geometry.parameters.radius + radius - entity.object.position.distanceTo(this.object.position);

        //                         if (penetrationDepth > 0) {




        //                             // let dist = entity.object.position
        //                             //     .clone()
        //                             //     .sub(this.object.position)
        //                             // let penetrationResponse = dist
        //                             //     .normalize()
        //                             //     .multiplyScalar(penetrationDepth)

        //                             // let penetrationResponseThis = this.options.enableCollisionResponse ? (entity.options.enableCollisionResponse ? 1 : 2) : 0
        //                             // let penetrationResponseObject = entity.options.enableCollisionResponse ? (this.options.enableCollisionResponse ? 1 : 2) : 0

        //                             // entity.object.position.add(penetrationResponse.divideScalar(penetrationResponseObject))
        //                             // this.object.position.add(penetrationResponse.divideScalar(-penetrationResponseThis))


        //                             // if (this.options.enableCollisionResponse) {
        //                             // let normal = penetrationResponse
        //                             // let relVal = this.velocity.clone().sub(entity.velocity)
        //                             // let sepVal = relVal.dot(normal)
        //                             // let newSepVal = -sepVal
        //                             // // let energy = Math.min(this.energy, entity.energy)
        //                             // let sepVelVec = normal.multiplyScalar(newSepVal)
        //                             // // this.energy -= .1
        //                             // // if (this.energy < 0) this.energy = 0
        //                             // this.velocity.add(sepVelVec.divideScalar(this.mass))
        //                             // entity.velocity.add(sepVelVec.divideScalar(entity.mass))
        //                             // }

        //                         }
        //                     }
        //                 }
        //             }
        //         }

        //     });
        // }

    }

    /*
        TODO:
        - Pouvoir indiquer la source de la gravité
        - Ajouter des type de collision et appliquer des calculs différents (sphere, capsule, plan)
            - Pour chaque RigidBody, avoir un tableau de "collisionResolvers"
            - Chaque collision resolver sera responsable de sa propre "réponse" à la collision
            - Les exécuter tous avant d'update la position
        - Ajouter des contraintes (liaison entre les objets)

        - Ajouter une option pour le type de gravité 
            - directional : 
                - par défaut sur l'axe -y,
                - sinon un vecteur qui sera la direction
            - space? : tous les objets s'attirent entre eux
                - par défaut avec une force de 1
                - sinon indiquer la masse en "auto", elle sera de la valeur du volume
                - sinon accepter une valeur

        Priorité :
        - Créer une class qui permet d'avoir des champs modifiables et reliés à une valeur d'un actor ou d'autres valeurs plus globales (tick, scene manager ...)
            - Récupérer toutes les propriétés publics de chaque objet
        - Création de scene
            - Bouton "+" créer un scene
            - Pouvoir cliquer glisser des actors dans la scene
            - Chaque nouvel actor est ajouté a scene manager et les inputs modifiant ses propriétés internes seront disponible
            - Pouvoir modifier la scene et modifier le code en direct sans que la scene ne se recharge
            - Enregistrer l'état de la scene pour pouvoir revenir dessus quand on veut

    */

    applyGravity() {
        if (this.object) {

            // Formule = gravité (9.81 pour la terre) * mass / rayon * rayon
            // Gravité : GRAV_CONSTANT * mass1 * mass2 / distance^2
            // Force = masse * acceleration

            // Check if gravity is enabled on this object
            if (this.options && this.options.gravity) {

                // if (window.__jeesee__.game?.scene?.sceneManager) {
                // let entities = window.__jeesee__.game.scene?.sceneManager.entities
                // entities.forEach(entity => {

                //     if (entity !== this && entity.object && entity instanceof RigidBody && this.object) {

                //         let dist = entity.object.position.distanceTo(this.object.position)
                //         if (dist < 0.001) console.log("ARGH!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
                //         let forceDirection = entity.object.position.clone().sub(this.object.position).normalize()
                //         let force = forceDirection.multiplyScalar(this.gravityConstant * this.mass * entity.mass).divideScalar(dist * dist)
                //         let acceleration = force.divideScalar(this.mass)

                //         this.velocity.add(acceleration.multiplyScalar(.5))
                //     }
                // })

                // }
                // let gravity = this.gravityOrigin.clone().sub(this.object.position).normalize().multiplyScalar(this.gravityConstant)
                // this.acceleration.add(gravity.multiplyScalar(this.mass))
                // this.velocity.add(this.acceleration.clone().divideScalar(this.mass)).multiplyScalar(this.dt)
                // this.object.position.add(this.velocity.multiplyScalar(this.dt)).multiplyScalar(this.energy)



                // console.log("GRA", this)
                // let currentVelocity = this.object.position.clone().sub(this.lastPosition)
                // let distanceFromOrigin =  this.object.position.distanceTo(this.gravityOrigin)
                // let directionToOrigin = this.gravityOrigin.clone().sub(this.object.position)
                // this.acceleration = directionToOrigin.clone().multiplyScalar(this.mass).multiplyScalar(.00001)
                // this.velocity.add(this.acceleration)


            }
        }
    }

    updatePosition(tick) {
        if (this.object) {
            // this.lastPosition = this.object.position.clone()
            this.object.position.add(this.velocity.multiplyScalar(.5));
            // this.velocity = this.object.position.clone().sub(this.lastPosition)
            // this.energy *= .999995
        }
    }


}

export default RigidBody;